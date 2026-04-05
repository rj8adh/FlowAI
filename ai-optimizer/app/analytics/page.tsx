"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  requestsPerDay: { date: string; count: number }[];
  moduleUsage: { id: string; name: string; hits: number; category: string }[];
  securityEvents: { type: string; count: number; color: string }[];
  costSavings: { tokensSaved: number; estimatedDollars: number; avgCompressionRatio: number; translationRequests: number };
  statusBreakdown: { status: string; count: number }[];
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => {
        const pct = (d.count / max) * 100;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: "100px" }}>
              <div
                className="w-full rounded-t-md bg-[var(--accent-blue)] opacity-60 group-hover:opacity-100 transition-all duration-200"
                style={{ height: `${pct}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {d.count.toLocaleString()}
              </div>
            </div>
            <span className="text-[9px] text-[var(--text-muted)] whitespace-nowrap">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

function HorizBar({ name, hits, max, category }: { name: string; hits: number; max: number; category: string }) {
  const pct = (hits / max) * 100;
  const color = category === "Security" ? "bg-red-400" : "bg-amber-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[var(--text-secondary)]">{name}</span>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">{hits.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} opacity-70 transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(setData);
  }, []);

  const totalRequests = data?.statusBreakdown.reduce((s, b) => s + b.count, 0) ?? 0;
  const maxModuleHits = data ? Math.max(...data.moduleUsage.map(m => m.hits)) : 1;

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Analytics</h1>
          <div className="h-3.5 w-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">Last 7 days</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
          {["7d", "30d", "90d"].map((r, i) => (
            <button key={r} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${i === 0 ? "bg-[var(--bg-overlay)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5 fade-up">
        {/* Top stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: totalRequests.toLocaleString(), sub: "Last 7 days", color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Cost Saved", value: `$${data?.costSavings.estimatedDollars.toFixed(2) ?? "—"}`, sub: "Via compression", color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Security Events", value: (data?.securityEvents.reduce((s, e) => s + e.count, 0) ?? 0).toLocaleString(), sub: "Blocked or flagged", color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Tokens Saved", value: data ? `${(data.costSavings.tokensSaved / 1000).toFixed(0)}k` : "—", sub: `${((data?.costSavings.avgCompressionRatio ?? 0) * 100).toFixed(0)}% avg compression`, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs font-medium text-[var(--text-primary)] mt-1">{s.label}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Requests chart + status breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Requests Over Time</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Daily pipeline request volume</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-[var(--accent-blue)] opacity-60" />
                <span className="text-[10px] text-[var(--text-muted)]">Requests</span>
              </div>
            </div>
            {data ? <BarChart data={data.requestsPerDay} /> : (
              <div className="h-32 flex items-center justify-center">
                <div className="text-xs text-[var(--text-muted)] animate-pulse">Loading chart...</div>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {data?.statusBreakdown.map(s => {
                const pct = totalRequests ? ((s.count / totalRequests) * 100).toFixed(1) : "0";
                const colors: Record<string, string> = { passed: "bg-green-400", blocked: "bg-red-400", error: "bg-amber-400" };
                return (
                  <div key={s.status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] capitalize text-[var(--text-secondary)]">{s.status}</span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">{s.count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[s.status]} opacity-70`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Donut-style legend */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-1.5">
              {data?.statusBreakdown.map(s => {
                const dotColors: Record<string, string> = { passed: "bg-green-400", blocked: "bg-red-400", error: "bg-amber-400" };
                return (
                  <div key={s.status} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColors[s.status]}`} />
                    <span className="text-[10px] text-[var(--text-muted)] capitalize flex-1">{s.status}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{s.count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Module usage + security events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Module Usage</h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">How often each module was triggered</p>
            <div className="space-y-3">
              {data?.moduleUsage.map(m => (
                <HorizBar key={m.id} name={m.name} hits={m.hits} max={maxModuleHits} category={m.category} />
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Security Events</h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">Breakdown of security-related interventions</p>
            <div className="space-y-3">
              {data?.securityEvents.map(e => {
                const total = data.securityEvents.reduce((s, ev) => s + ev.count, 0);
                const pct = ((e.count / total) * 100).toFixed(1);
                const colors: Record<string, string> = { red: "bg-red-400", orange: "bg-orange-400", purple: "bg-purple-400" };
                return (
                  <div key={e.type} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[var(--text-secondary)]">{e.type}</span>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">{e.count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[e.color]} opacity-70`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">FinOps Summary</div>
              {[
                ["Tokens saved", `${((data?.costSavings.tokensSaved ?? 0) / 1000).toFixed(1)}k`],
                ["Est. cost reduction", `$${data?.costSavings.estimatedDollars.toFixed(2) ?? "—"}`],
                ["Translation requests", (data?.costSavings.translationRequests ?? 0).toLocaleString()],
                ["Avg compression", `${((data?.costSavings.avgCompressionRatio ?? 0) * 100).toFixed(0)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1">
                  <span className="text-[11px] text-[var(--text-muted)]">{k}</span>
                  <span className="text-[11px] font-mono text-[var(--text-secondary)]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
