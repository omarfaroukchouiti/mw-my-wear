"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { useCart } from "@/components/cart";
import { Garment } from "@/components/garment";
import { deliveryFee, isNewWilaya, type DeliveryMode, type Wilaya } from "@/lib/algeria";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPrice, getProduct, type GarmentType } from "@/lib/products";

export const LAST_ORDER_KEY = "mw.lastOrder";

type Rate = { home: number; desk: number };

export function CheckoutForm({
  locale,
  dict,
  wilayas,
}: {
  locale: Locale;
  dict: Dictionary;
  wilayas: Wilaya[];
}) {
  const { lines, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const t = dict.checkout;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState(0);
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMode>("home");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  /** Same key for retries so a double click cannot create two orders. */
  const idempotencyKey = useRef<string | null>(null);
  /**
   * Owner-edited prices from the database. The server always recomputes the
   * total from its own copy; this only keeps the summary honest.
   */
  const [rates, setRates] = useState<Record<number, Rate> | null>(null);
  const [ratesFailed, setRatesFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/delivery-rates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("rates");
        const data = (await response.json()) as {
          rates?: { code: number; home: number; desk: number }[];
        };
        if (!alive) return;
        const table: Record<number, Rate> = {};
        for (const rate of data.rates ?? []) {
          if (typeof rate?.code === "number") {
            table[rate.code] = { home: rate.home, desk: rate.desk };
          }
        }
        setRates(table);
      })
      .catch(() => {
        if (alive) setRatesFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const priceFor = (code: number, mode: DeliveryMode): number => {
    const rate = rates?.[code];
    if (rate) return mode === "desk" ? rate.desk : rate.home;
    return deliveryFee(code, mode);
  };

  const fee = useMemo(
    () => (wilayaCode ? priceFor(wilayaCode, delivery) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wilayaCode, delivery, rates],
  );
  const total = subtotal + fee;
  const selectedWilaya = wilayaCode ? wilayas.find((item) => item.code === wilayaCode) : undefined;

  if (!ready) {
    return <div className="py-24 text-sm text-ink-soft">…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="border border-line py-20 text-center">
        <p className="text-sm text-ink-soft">{t.empty}</p>
        <Link href={`/${locale}/products`} className="mw-btn mw-btn-solid mt-6">
          {t.emptyCta}
        </Link>
      </div>
    );
  }

  const bad = (field: string) => invalid.includes(field);
  const ring = (field: string) => (bad(field) ? "border-red-600" : "border-line");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;

    const problems: string[] = [];
    if (name.trim().length < 3) problems.push("name");
    if (phone.replace(/\D/g, "").length < 9) problems.push("phone");
    if (!wilayaCode) problems.push("wilaya");
    if (commune.trim().length < 2) problems.push("commune");
    if (address.trim().length < 5) problems.push("address");
    setInvalid(problems);
    setFatal(null);
    if (problems.length) return;

    setSending(true);
    try {
      if (!idempotencyKey.current) {
        idempotencyKey.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `mw-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          locale,
          customer: { name, phone, wilayaCode, commune, address, delivery, notes },
          items: lines.map((line) => ({
            slug: line.slug,
            colorHex: line.colorHex,
            size: line.size,
            qty: line.qty,
            front: line.front,
            back: line.back,
          })),
        }),
      });

      if (response.status === 201) {
        const data = (await response.json()) as { order: unknown };
        try {
          window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data.order));
        } catch {
          // Private mode can block storage; the success page handles it.
        }
        clear();
        router.push(`/${locale}/checkout/success`);
        return;
      }

      if (response.status === 400) {
        const data = (await response.json()) as { fields?: string[] };
        setInvalid(data.fields ?? []);
        setFatal(t.errorFields);
      } else if (response.status === 429) {
        setFatal(t.errorRate);
      } else {
        setFatal(t.errorServer);
      }
    } catch {
      setFatal(t.errorNetwork);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-10">
        {/* ------------------------------ contact ------------------------------ */}
        <fieldset>
          <legend className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {t.contact}
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t.name} htmlFor="name">
              <input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.namePlaceholder}
                autoComplete="name"
                required
                className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink ${ring("name")}`}
              />
            </Field>
            <Field label={t.phone} htmlFor="phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t.phonePlaceholder}
                autoComplete="tel"
                dir="ltr"
                required
                className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink ${ring("phone")}`}
              />
              <p className="mt-1.5 text-[10px] text-ink-soft">{t.phoneNote}</p>
            </Field>
          </div>
        </fieldset>

        {/* ------------------------------ address ------------------------------ */}
        <fieldset>
          <legend className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {t.deliveryTitle}
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={t.wilaya} htmlFor="wilaya">
              <select
                id="wilaya"
                name="wilaya"
                value={wilayaCode || ""}
                onChange={(event) => setWilayaCode(Number(event.target.value))}
                required
                className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink ${ring("wilaya")}`}
              >
                <option value="">{t.chooseWilaya}</option>
                {wilayas.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.code}>
                    {String(wilaya.code).padStart(2, "0")} — {locale === "ar" ? wilaya.ar : wilaya.en}
                  </option>
                ))}
              </select>
              {selectedWilaya && isNewWilaya(selectedWilaya) && (
                <p className="mt-1.5 text-[10px] leading-relaxed text-ink-soft">{t.newWilayaNote}</p>
              )}
            </Field>
            <Field label={t.commune} htmlFor="commune">
              <input
                id="commune"
                name="commune"
                value={commune}
                onChange={(event) => setCommune(event.target.value)}
                placeholder={t.communePlaceholder}
                required
                className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink ${ring("commune")}`}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={t.address} htmlFor="address">
              <textarea
                id="address"
                name="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={t.addressPlaceholder}
                rows={2}
                required
                className={`w-full resize-none border bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink ${ring("address")}`}
              />
            </Field>
          </div>
        </fieldset>

        {/* ------------------------------ method ------------------------------- */}
        <fieldset>
          <legend className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {t.method}
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["home", "desk"] as DeliveryMode[]).map((mode) => {
              const active = delivery === mode;
              const price = wilayaCode ? priceFor(wilayaCode, mode) : null;
              return (
                <label
                  key={mode}
                  className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                    active ? "border-ink bg-paper-dim" : "border-line hover:border-ink/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={mode}
                    checked={active}
                    onChange={() => setDelivery(mode)}
                    className="mt-0.5 accent-ink"
                  />
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {mode === "home" ? t.home : t.desk}
                      </span>
                      <span className="text-[11px] tabular-nums text-ink-soft">
                        {price === null ? "—" : formatPrice(price, locale)}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-ink-soft">
                      {mode === "home" ? t.homeNote : t.deskNote}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {ratesFailed && (
            <p className="mt-3 text-[10px] leading-relaxed text-ink-soft">{t.ratesFallback}</p>
          )}
        </fieldset>

        <Field label={t.notes} htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t.notesPlaceholder}
            rows={2}
            maxLength={500}
            className="w-full resize-none border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        {fatal && (
          <p role="alert" className="border border-red-600 bg-red-50 px-4 py-3 text-xs text-red-700">
            {fatal}
          </p>
        )}

        <div className="hidden lg:block">
          <SubmitButton sending={sending} label={t.submit} busyLabel={t.submitting} />
        </div>
      </div>

      {/* -------------------------------- summary ------------------------------- */}
      <aside className="h-fit border border-line p-6 lg:sticky lg:top-24">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.summary}</p>

        <ul className="mt-4 space-y-4">
          {lines.map((line) => {
            const product = getProduct(line.slug);
            const preview = line.front?.preview ?? line.back?.preview;
            return (
              <li key={line.key} className="flex gap-3">
                <div className="flex h-16 w-14 shrink-0 items-center justify-center border border-line bg-stage">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : (
                    <Garment
                      type={line.type as GarmentType}
                      color={line.colorHex}
                      className="h-full w-full p-1"
                      mark={false}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {product ? product.name[locale] : line.slug}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-soft">
                    {locale === "ar" ? line.colorNameAr : line.colorNameEn} · {line.size} · ×
                    {line.qty}
                  </p>
                  <p className="mt-1 text-[11px] tabular-nums">
                    {formatPrice(line.price * line.qty, locale)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
            <dd className="tabular-nums">{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">{dict.cart.shipping}</dt>
            <dd className="tabular-nums">
              {wilayaCode ? formatPrice(fee, locale) : dict.cart.shippingNote}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold">
            <dt>{dict.cart.total}</dt>
            <dd className="tabular-nums">{formatPrice(total, locale)}</dd>
          </div>
        </dl>

        <div className="mt-5 border border-line bg-paper-dim p-3">
          <p className="text-[11px] font-semibold">{t.cod}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink-soft">{t.codNote}</p>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-ink-soft">{t.privacy}</p>

        <div className="mt-5 lg:hidden">
          <SubmitButton sending={sending} label={t.submit} busyLabel={t.submitting} />
        </div>

        <Link
          href={`/${locale}/cart`}
          className="mt-4 block text-center text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
        >
          ← {t.back}
        </Link>
      </aside>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitButton({
  sending,
  label,
  busyLabel,
}: {
  sending: boolean;
  label: string;
  busyLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={sending}
      className="mw-btn mw-btn-solid w-full disabled:opacity-50"
    >
      {sending ? busyLabel : label}
    </button>
  );
}
