"use client";

import { useEffect } from "react";

import { MoonIcon, SunIcon } from "@/components/icons";

const STORAGE_KEY = "mw-theme";

type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Light/dark switch.
 *
 * The initial theme is applied before paint by the inline script in
 * `[locale]/layout.tsx`, so this component only has to flip it and persist the
 * choice. Both glyphs are rendered on the server and CSS picks the visible one
 * from `data-theme`, which avoids a hydration mismatch.
 */
export function ThemeToggle({ label }: { label: string }) {
  useEffect(() => {
    // First visit (or cleared storage): keep following the OS setting live.
    if (!storedTheme()) applyTheme(systemTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!storedTheme()) applyTheme(systemTheme());
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const current: Theme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";

    applyTheme(next);

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled — the toggle still works per page.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="mw-icon-btn"
    >
      <span className="mw-theme-moon">
        <MoonIcon size={19} />
      </span>
      <span className="mw-theme-sun">
        <SunIcon size={19} />
      </span>
    </button>
  );
}
