"use client";

interface PipelineFlowProps {
  activeModules: Set<string>;
  totalLatency: number;
}

const stages = [
  {
    id: "ingestion",
    label: "Ingestion",
    sublabel: "Raw request",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v12M1 7l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-[var(--text-secondary)]",
    alwaysActive: true,
  },
  {
    id: "security-pre",
    label: "Security",
    sublabel: "Pre-flight",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L2 3v4c0 2.8 2.2 4.7 5 5 2.8-.3 5-2.2 5-5V3L7 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4.5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-[var(--accent-red)]",
    moduleIds: ["pii-scrubber", "prompt-injection"],
    alwaysActive: false,
  },
  {
    id: "finops-pre",
    label: "FinOps",
    sublabel: "Compression",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 10l4-4 2 2 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-[var(--accent-amber)]",
    moduleIds: ["context-compressor", "auto-translator"],
    alwaysActive: false,
  },
  {
    id: "api-call",
    label: "LLM API",
    sublabel: "OpenAI / Anthropic",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 7h5M9.5 7L7.5 5M9.5 7L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-[var(--accent-blue)]",
    alwaysActive: true,
  },
  {
    id: "post-flight",
    label: "Post-flight",
    sublabel: "Response checks",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 13L2 11V7c0-2.8 2.2-4.7 5-5 2.8.3 5 2.2 5 5v4L7 13z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5 7l1.5 1.5L9.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-[var(--accent-purple)]",
    moduleIds: ["reverse-translator", "data-exfiltration"],
    alwaysActive: false,
  },
  {
    id: "return",
    label: "Return",
    sublabel: "Processed response",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 13V1M1 7l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-[var(--accent-green)]",
    alwaysActive: true,
  },
];

export default function PipelineFlow({ activeModules, totalLatency }: PipelineFlowProps) {
  const isStageActive = (stage: typeof stages[0]) => {
    if (stage.alwaysActive) return true;
    if (!stage.moduleIds) return false;
    return stage.moduleIds.some((id) => activeModules.has(id));
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pipeline Flow</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Active middleware execution order</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Live</span>
          </div>
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <span className="text-xs font-mono text-[var(--accent-amber)]">+{totalLatency}ms</span>
            <span className="text-xs text-[var(--text-muted)] ml-1">overhead</span>
          </div>
        </div>
      </div>

      {/* Flow nodes */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const active = isStageActive(stage);
          return (
            <div key={stage.id} className="flex items-center shrink-0">
              {/* Node */}
              <div
                className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-all ${
                  active
                    ? "bg-[var(--bg-elevated)] border-[var(--border)] opacity-100"
                    : "bg-[var(--bg-base)] border-[var(--border-subtle)] opacity-40"
                }`}
                style={
                  active && stage.id !== "ingestion" && stage.id !== "api-call" && stage.id !== "return"
                    ? { boxShadow: "0 0 0 1px var(--border), 0 0 12px rgba(79,126,255,0.08)" }
                    : {}
                }
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    active ? `bg-[var(--bg-overlay)] ${stage.color}` : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  }`}
                >
                  {stage.icon}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-semibold leading-tight ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5 whitespace-nowrap">
                    {stage.sublabel}
                  </div>
                </div>
              </div>

              {/* Connector */}
              {i < stages.length - 1 && (
                <div className="flex items-center w-6 shrink-0">
                  <div className={`h-px flex-1 transition-all ${active && isStageActive(stages[i + 1]) ? "bg-[var(--border)]" : "bg-[var(--border-subtle)]"}`} />
                  <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className={active && isStageActive(stages[i + 1]) ? "text-[var(--border)]" : "text-[var(--border-subtle)]"}>
                    <path d="M1 1l4 2-4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Legend</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-[var(--accent-red)] opacity-80" />
          <span className="text-[10px] text-[var(--text-muted)]">Security</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-[var(--accent-amber)] opacity-80" />
          <span className="text-[10px] text-[var(--text-muted)]">FinOps</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-[var(--accent-blue)] opacity-80" />
          <span className="text-[10px] text-[var(--text-muted)]">Core</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
          <span className="text-[10px] text-[var(--text-muted)]">Inactive module</span>
        </div>
      </div>
    </div>
  );
}
