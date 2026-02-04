"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "optipic-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(storageKey) as Theme | null;
    return saved ?? getSystemTheme();
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:border-white/30 hover:bg-white/10"
      aria-label="Toggle theme"
      type="button"
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
