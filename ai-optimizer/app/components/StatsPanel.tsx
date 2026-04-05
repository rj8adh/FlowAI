"use client";

import { useEffect, useState } from "react";

interface StatEntry {
  key: string;
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

interface StatsData {
  stats: StatEntry[];
  health: {
    uptime: string;
    avgResponse: string;
    status: string;
  };
}

interface StatsPanelProps {
  totalLatency: number;
  activeModules: number;
}

const statIcons: Record<string, React.ReactNode> = {
  requestsToday: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 7h12M7 1v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  piiBlocked: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L2 3v4c0 2.8 2.2 4.7 5 5 2.8-.3 5-2.2 5-5V3L7 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  tokensSaved: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 10l4-4 2 2 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  injectionsBlocked: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5l4 4M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const statColors: Record<string, { color: string; bg: string }> = {
  requestsToday:     { color: "text-blue-400",   bg: "bg-blue-500/10" },
  piiBlocked:        { color: "text-red-400",    bg: "bg-red-500/10" },
  tokensSaved:       { color: "text-amber-400",  bg: "bg-amber-500/10" },
  injectionsBlocked: { color: "text-purple-400", bg: "bg-purple-500/10" },
};

export default function StatsPanel({ totalLatency, activeModules }: StatsPanelProps) {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const stats = data?.stats ?? [];
  const health = data?.health;

  return (
    <div className="space-y-3">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const icon = statIcons[stat.key];
          const color = statColors[stat.key] ?? { color: "text-[var(--text-secondary)]", bg: "bg-[var(--bg-overlay)]" };
          return (
            <div
              key={stat.key}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[rgba(79,126,255,0.2)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`w-8 h-8 rounded-lg ${color.bg} ${color.color} flex items-center justify-center`}>
                  {icon}
                </div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    stat.up ? "bg-green-500/10 text-green-400" : "bg-[var(--bg-overlay)] text-[var(--text-muted)]"
                  }`}
                >
                  {stat.delta}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-[var(--text-primary)] leading-none">{stat.value}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">{stat.label}</div>
              </div>
            </div>
          );
        })}

        {/* Skeleton cards while loading */}
        {!data && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-overlay)]" />
            <div className="mt-3 h-6 w-16 bg-[var(--bg-overlay)] rounded" />
            <div className="mt-1 h-3 w-24 bg-[var(--bg-overlay)] rounded" />
          </div>
        ))}
      </div>

      {/* Pipeline health */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--text-primary)]">Pipeline Health</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
            health?.status === "operational"
              ? "text-[var(--accent-green)] bg-green-500/10"
              : "text-amber-400 bg-amber-500/10"
          }`}>
            {health?.status ?? "—"}
          </span>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Active modules</span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">{activeModules} / 6</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Added latency</span>
            <span className={`text-[11px] font-mono ${totalLatency > 80 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
              +{totalLatency}ms
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Uptime</span>
            <span className="text-[11px] font-mono text-[var(--accent-green)]">{health?.uptime ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Avg response</span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">{health?.avgResponse ?? "—"}</span>
          </div>
        </div>

        {/* Latency bar */}
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[var(--text-muted)]">Overhead budget</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{totalLatency}ms / 200ms</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalLatency > 150 ? "bg-red-400" : totalLatency > 80 ? "bg-amber-400" : "bg-[var(--accent-green)]"
              }`}
              style={{ width: `${Math.min((totalLatency / 200) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
