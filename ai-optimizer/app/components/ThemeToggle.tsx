"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has a saved preference
    const saved = localStorage.getItem("theme-mode");
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.add("light-mode");
    } else {
      setIsDark(true);
      document.documentElement.classList.remove("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.remove("light-mode");
      localStorage.setItem("theme-mode", "dark");
    } else {
      document.documentElement.classList.add("light-mode");
      localStorage.setItem("theme-mode", "light");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-300">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
