"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  model: string;
  status: "passed" | "blocked" | "error";
  modules: string[];
  latencyMs: number;
  overheadMs: number;
  tokensIn: number;
  tokensOut: number;
  prompt: string;
}

const statusConfig = {
  passed:  { label: "Passed",  bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-400" },
  blocked: { label: "Blocked", bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400" },
  error:   { label: "Error",   bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400" },
};

const moduleLabels: Record<string, string> = {
  "perplexity-check": "Perplexity",
  "llm-check": "LLM Check",
  "pii-scrubber": "PII",
  "context-compressor": "Compress",
  "auto-translator": "Translate↑",
  "reverse-translator": "Translate↓",
  "data-exfiltration": "Exfil",
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "passed" | "blocked" | "error">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.status === filter);

  const counts = {
    all: logs.length,
    passed: logs.filter(l => l.status === "passed").length,
    blocked: logs.filter(l => l.status === "blocked").length,
    error: logs.filter(l => l.status === "error").length,
  };

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Request Logs</h1>
          <div className="h-3.5 w-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">{logs.length} total</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)]">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 9l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input className="bg-transparent text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] outline-none w-32" placeholder="Search by ID..." />
          </div>
          <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)]">
              <path d="M10 3L1 3M1 3L4 1M1 3L4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 9L11 9M11 9L8 11M11 9L8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4 fade-up">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-1 w-fit">
          {(["all", "passed", "blocked", "error"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {f !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[f].dot}`} />}
              <span className="capitalize">{f}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? "bg-[var(--bg-overlay)]" : "bg-transparent"} text-[var(--text-muted)]`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[140px_100px_80px_1fr_90px_90px] gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            {["Request ID", "Status", "Model", "Modules", "Latency", "Tokens"].map(h => (
              <span key={h} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">No logs yet</div>
          )}
          {filtered.map(log => {
            const st = statusConfig[log.status];
            const isOpen = expanded === log.id;
            return (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  className="w-full grid grid-cols-[140px_100px_80px_1fr_90px_90px] gap-3 px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors text-left"
                >
                  <div>
                    <div className="text-xs font-mono text-[var(--text-secondary)]">{log.id}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{timeAgo(log.timestamp)}</div>
                  </div>
                  <span className={`self-center inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold w-fit ${st.bg} ${st.text}`}>
                    <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                  <span className="self-center text-[11px] font-mono text-[var(--text-muted)]">{log.model.replace("gpt-", "").replace("claude-", "cl-")}</span>
                  <div className="self-center flex flex-wrap gap-1">
                    {log.modules.length === 0
                      ? <span className="text-[10px] text-[var(--text-muted)] italic">pass-through</span>
                      : log.modules.map(m => (
                        <span key={m} className="text-[10px] bg-[var(--bg-overlay)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded-md">
                          {moduleLabels[m] ?? m}
                        </span>
                      ))
                    }
                  </div>
                  <span className="self-center text-[11px] font-mono text-[var(--text-secondary)]">{log.latencyMs}ms</span>
                  <span className="self-center text-[11px] font-mono text-[var(--text-muted)]">{log.tokensIn}↑ {log.tokensOut}↓</span>
                </button>

                {/* Expanded row */}
                {isOpen && (
                  <div className="px-4 py-3 bg-[var(--bg-base)] border-b border-[var(--border-subtle)] grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Prompt preview</div>
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono bg-[var(--bg-overlay)] rounded-lg p-3 border border-[var(--border-subtle)]">
                        &ldquo;{log.prompt}&rdquo;
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Request details</div>
                      {[
                        ["Request ID", log.id],
                        ["Model", log.model],
                        ["Pipeline overhead", `+${log.overheadMs}ms`],
                        ["Tokens in / out", `${log.tokensIn} / ${log.tokensOut}`],
                        ["Total latency", `${log.latencyMs}ms`],
                        ["Timestamp", new Date(log.timestamp).toLocaleString()],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-[11px] text-[var(--text-muted)]">{k}</span>
                          <span className="text-[11px] font-mono text-[var(--text-secondary)]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
