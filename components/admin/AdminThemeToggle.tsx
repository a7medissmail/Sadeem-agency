"use client";

import { useEffect, useState } from "react";

type AdminTheme = "dark" | "light";

const storageKey = "sadeem-admin-theme";

function applyTheme(theme: AdminTheme) {
  const root = document.querySelector<HTMLElement>(".admin-root");
  if (root) {
    root.dataset.adminTheme = theme;
  }
  document.documentElement.style.colorScheme = theme;
}

export function AdminThemeToggle() {
  const [theme, setTheme] = useState<AdminTheme>("dark");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    const initialTheme: AdminTheme = storedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: AdminTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch admin to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span className="admin-theme-toggle-track" aria-hidden="true">
        <span className="admin-theme-toggle-dot" />
      </span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
