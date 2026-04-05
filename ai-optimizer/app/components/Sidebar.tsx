"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    href: "/policy-builder",
    label: "Policy Builder",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/logs",
    label: "Request Logs",
    badge: "2.4k",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3-4 3 2 3-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/api-keys",
    label: "API Keys",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 8h5M12 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    href: "/docs",
    label: "Docs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L2 3.5v4L7 10l5-2.5v-4L7 1z" fill="white" opacity="0.9" />
              <path d="M2 7.5L7 10l5-2.5" stroke="white" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)] leading-tight">AI Optimizer</div>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">Middleware Pipeline</div>
          </div>
        </Link>
      </div>

      {/* Project badge */}
      <div className="px-3 py-3 border-b border-[var(--border)]">
        <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-teal-600 text-[9px] font-bold text-white flex items-center justify-center shrink-0">P</div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium text-[var(--text-primary)] leading-tight">Production</div>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">OpenAI GPT-4o</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)]">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? "bg-[var(--accent-blue-glow)] text-[var(--accent-blue)] border border-[rgba(79,126,255,0.2)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-[var(--bg-overlay)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[var(--border)] space-y-0.5">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? "bg-[var(--accent-blue-glow)] text-[var(--accent-blue)] border border-[rgba(79,126,255,0.2)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        <div className="mt-2 px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">N</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[var(--text-primary)] truncate">Nischal K.</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
