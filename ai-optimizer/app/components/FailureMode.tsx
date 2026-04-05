"use client";

interface FailureModeProps {
  mode: "open" | "closed";
  onChange: (mode: "open" | "closed") => void;
}

export default function FailureMode({ mode, onChange }: FailureModeProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-secondary)]">
          <path d="M7 1L2 3v4c0 2.8 2.2 4.7 5 5 2.8-.3 5-2.2 5-5V3L7 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold text-[var(--text-primary)]">Failure Mode</span>
      </div>

      <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">
        What happens if a middleware module crashes or times out?
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* Fail Open */}
        <button
          onClick={() => onChange("open")}
          className={`relative p-3 rounded-lg border text-left transition-all ${
            mode === "open"
              ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]"
              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border)]"
          }`}
        >
          {mode === "open" && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
          <div className={`text-xs font-semibold mb-1 ${mode === "open" ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
            Fail Open
          </div>
          <div className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Bypass module, send prompt directly to LLM. App stays alive.
          </div>
        </button>

        {/* Fail Closed */}
        <button
          onClick={() => onChange("closed")}
          className={`relative p-3 rounded-lg border text-left transition-all ${
            mode === "closed"
              ? "bg-red-500/10 border-red-500/30 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]"
              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border)]"
          }`}
        >
          {mode === "closed" && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400" />
          )}
          <div className={`text-xs font-semibold mb-1 ${mode === "closed" ? "text-red-400" : "text-[var(--text-secondary)]"}`}>
            Fail Closed
          </div>
          <div className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Block the prompt entirely. Maximum security posture.
          </div>
        </button>
      </div>

      <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-lg ${
        mode === "open" ? "bg-amber-500/5 border border-amber-500/15" : "bg-red-500/5 border border-red-500/15"
      }`}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`mt-0.5 shrink-0 ${mode === "open" ? "text-amber-400" : "text-red-400"}`}>
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
          {mode === "open"
            ? "Lower security — your app won't break but unfiltered prompts may reach the LLM."
            : "Higher security — users may see errors if any middleware module fails."}
        </p>
      </div>
    </div>
  );
}
