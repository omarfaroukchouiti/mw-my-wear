/**
 * Verifies the database migrations against a real PostgreSQL engine running
 * inside WebAssembly (PGlite) — no Supabase project, no Docker, no credentials.
 *
 *   npm run verify:sql
 *
 * It answers the only question that matters before deploying phase 3:
 * does `create_order` really write the order, its items and history in one
 * transaction, and does it really refuse to create the same order twice?
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function all(db, sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows;
}

async function main() {
  const db = new PGlite();

  // Supabase creates these roles; a plain PostgreSQL engine does not.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
  `);

  const schema = (await readFile(join(root, "supabase/schema.sql"), "utf8"))
    // PGlite ships pgcrypto already; gen_random_uuid() is built in.
    .replace(/create extension[^;]*;/gi, "");

  await db.exec(schema);
  console.log("schema.sql applied");

  for (const file of [
    "002_admin_sessions.sql",
    "003_order_integrity.sql",
    "004_delivery_rates.sql",
  ]) {
    await db.exec(await readFile(join(root, "supabase/migrations", file), "utf8"));
    console.log(`${file} applied`);
  }

  const order = {
    number: "MW-TESTAAA1",
    created_at: new Date().toISOString(),
    locale: "ar",
    customer_name: "اختبار المرحلة الثالثة",
    phone: "0550000000",
    wilaya_code: 16,
    wilaya_ar: "الجزائر",
    wilaya_en: "Algiers",
    commune: "باب الزوار",
    address: "عنوان تجريبي للاختبار الآلي",
    delivery: "home",
    notes: null,
    subtotal: 5800,
    delivery_fee: 500,
    total: 6300,
  };

  const items = [
    {
      position: 0,
      slug: "essential-tee",
      name_ar: "قميص أساسي",
      name_en: "Essential tee",
      type: "tee",
      color_hex: "#111110",
      color_name_ar: "أسود",
      color_name_en: "Black",
      size: "M",
      qty: 2,
      unit_price: 2900,
      line_total: 5800,
      preview_front: null,
      preview_back: null,
      design_front: '{"objects":[]}',
      design_back: null,
    },
  ];

  const key = "verify-key-0123456789abcdef";

  console.log("\natomic create");
  const first = await db.query("select public.create_order($1::jsonb, $2::jsonb, $3) as r", [
    JSON.stringify(order),
    JSON.stringify(items),
    key,
  ]);
  const firstResult = first.rows[0].r;
  check("returns the order number", firstResult.number === order.number, JSON.stringify(firstResult));
  check("first call is not a replay", firstResult.replayed === false);

  const counts = await all(
    db,
    `select
       (select count(*)::int from public.orders) as orders,
       (select count(*)::int from public.order_items) as items,
       (select count(*)::int from public.order_status_history) as history`,
  );
  check("one order written", counts[0].orders === 1, JSON.stringify(counts[0]));
  check("items written with the order", counts[0].items === 1);
  check("initial history row written", counts[0].history === 1);

  console.log("\nidempotency");
  const second = await db.query("select public.create_order($1::jsonb, $2::jsonb, $3) as r", [
    JSON.stringify({ ...order, number: "MW-TESTBBB2" }),
    JSON.stringify(items),
    key,
  ]);
  const secondResult = second.rows[0].r;
  check("second call is a replay", secondResult.replayed === true);
  check("replay returns the original order", secondResult.number === order.number);
  const afterReplay = await all(db, "select count(*)::int as n from public.orders");
  check("still exactly one order", afterReplay[0].n === 1, String(afterReplay[0].n));

  console.log("\nno idempotency key");
  const third = await db.query("select public.create_order($1::jsonb, $2::jsonb, $3) as r", [
    JSON.stringify({ ...order, number: "MW-TESTCCC3" }),
    JSON.stringify(items),
    null,
  ]);
  check("creates a second, distinct order", third.rows[0].r.number === "MW-TESTCCC3");

  console.log("\nrollback on bad items");
  const before = await all(db, "select count(*)::int as n from public.orders");
  let rolledBack = false;
  try {
    await db.query("select public.create_order($1::jsonb, $2::jsonb, $3)", [
      JSON.stringify({ ...order, number: "MW-TESTDDD4" }),
      JSON.stringify([{ ...items[0], qty: 0 }]),
      "verify-key-rollback-0001",
    ]);
  } catch {
    rolledBack = true;
  }
  const after = await all(db, "select count(*)::int as n from public.orders");
  check("constraint violation is raised", rolledBack);
  check("failed insert leaves no order behind", after[0].n === before[0].n, `${before[0].n} → ${after[0].n}`);

  console.log("\nempty cart");
  let emptyRejected = false;
  try {
    await db.query("select public.create_order($1::jsonb, '[]'::jsonb, null)", [
      JSON.stringify({ ...order, number: "MW-TESTEEE5" }),
    ]);
  } catch {
    emptyRejected = true;
  }
  check("empty item list is rejected", emptyRejected);

  console.log("\nstatus workflow");
  await db.query("update public.orders set status = 'confirmed' where number = $1", [order.number]);
  const history = await all(
    db,
    "select from_status, to_status from public.order_status_history where order_number = $1 order by id",
    [order.number],
  );  check("valid move is recorded", history.length === 2 && history[1].to_status === "confirmed", JSON.stringify(history));

  let illegal = false;
  try {
    await db.query("update public.orders set status = 'delivered' where number = $1", [order.number]);
  } catch (error) {
    illegal = /invalid_status_transition/.test(String(error));
  }
  check("skipping production is refused", illegal);

  await db.query("update public.orders set status = 'in_production' where number = $1", [order.number]);
  await db.query("update public.orders set status = 'shipped' where number = $1", [order.number]);
  await db.query("update public.orders set status = 'delivered' where number = $1", [order.number]);

  let terminal = false;
  try {
    await db.query("update public.orders set status = 'cancelled' where number = $1", [order.number]);
  } catch (error) {
    terminal = /invalid_status_transition/.test(String(error));
  }
  check("delivered is terminal", terminal);

  console.log("\ndelivery prices");
  const rls = await all(
    db,
    "select relrowsecurity as enabled from pg_class where oid = 'public.delivery_rates'::regclass",
  );
  check("row level security is enabled", rls[0]?.enabled === true);

  await db.query(
    "insert into public.delivery_rates (wilaya_code, home_fee, desk_fee) values (16, 500, 300)",
  );
  const upsert = await all(
    db,
    `insert into public.delivery_rates (wilaya_code, home_fee, desk_fee)
     values (16, 650, 350)
     on conflict (wilaya_code) do update
       set home_fee = excluded.home_fee, desk_fee = excluded.desk_fee
     returning home_fee, desk_fee`,
  );
  check("upsert replaces an existing price", upsert[0].home_fee === 650 && upsert[0].desk_fee === 350);

  const rows = await all(
    db,
    "select count(*)::int as n from public.delivery_rates where wilaya_code = 16",
  );
  check("upsert keeps one row per wilaya", rows[0].n === 1, String(rows[0].n));

  async function rejects(sql, params = []) {
    try {
      await db.query(sql, params);
      return false;
    } catch {
      return true;
    }
  }

  check(
    "negative fee is rejected",
    await rejects("insert into public.delivery_rates (wilaya_code, home_fee, desk_fee) values (17, -1, 300)"),
  );
  check(
    "fee above the ceiling is rejected",
    await rejects("insert into public.delivery_rates (wilaya_code, home_fee, desk_fee) values (18, 100001, 300)"),
  );
  check(
    "wilaya 0 is rejected",
    await rejects("insert into public.delivery_rates (wilaya_code, home_fee, desk_fee) values (0, 500, 300)"),
  );
  check(
    "wilaya 70 is rejected",
    await rejects("insert into public.delivery_rates (wilaya_code, home_fee, desk_fee) values (70, 500, 300)"),
  );
  check(
    "the new wilaya 69 is accepted",
    !(await rejects("insert into public.delivery_rates (wilaya_code, home_fee, desk_fee) values (69, 900, 500)")),
  );

  await db.close();

  console.log(failures === 0 ? "\nAll SQL checks passed." : `\n${failures} check(s) failed.`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
