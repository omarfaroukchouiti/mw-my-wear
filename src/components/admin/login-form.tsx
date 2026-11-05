"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { Dictionary, Locale } from "@/lib/i18n";

export function AdminLoginForm({
  locale,
  dict,
  configured,
  weak,
}: {
  locale: Locale;
  dict: Dictionary;
  configured: boolean;
  weak: boolean;
}) {
  const router = useRouter();
  const t = dict.admin;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className="max-w-md border border-line p-6">
        <p className="text-[13px] leading-relaxed text-ink-soft">{t.notConfigured}</p>
        <pre className="mt-4 overflow-x-auto border border-line bg-paper-dim p-3 text-[11px]" dir="ltr">
          {`ADMIN_PASSWORD=your-strong-password\nADMIN_SECRET=long-random-text`}
        </pre>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.replace(`/${locale}/admin`);
        router.refresh();
        return;
      }
      if (response.status === 401) setError(t.wrong);
      else if (response.status === 429) setError(t.rate);
      else setError(t.notConfigured);
    } catch {
      setError(t.wrong);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md">
      {weak && (
        <p className="mb-4 border border-amber-500 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800">
          {t.weak}
        </p>
      )}

      <form onSubmit={submit} className="border border-line p-6">
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-ink-soft"
        >
          {t.password}
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          autoFocus
          dir="ltr"
          className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        />

        {error && (
          <p role="alert" className="mt-4 border border-red-600 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="mw-btn mw-btn-solid mt-5 w-full disabled:opacity-50">
          {busy ? t.loggingIn : t.login}
        </button>
      </form>
    </div>
  );
}
