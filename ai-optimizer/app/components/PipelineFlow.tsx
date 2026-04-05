"use client";

import { Module } from "./ModuleCard";
import { DragEvent, useState } from "react";

interface PipelineFlowProps {
  modules: Module[];
  totalLatency: number;
  onToggle: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

const stageInfo = [
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
    moduleIds: ["perplexity-check", "llm-check", "pii-scrubber"],
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

export default function PipelineFlow({ modules, totalLatency, onToggle, onReorder }: PipelineFlowProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<"Pre" | "Post" | null>(null);

  const preModules = modules.filter((m) => m.phase === "Pre");
  const postModules = modules.filter((m) => m.phase === "Post");
  const activeModules = modules.filter((m) => m.enabled);

  const isStageActive = (phase: "Pre" | "Post") => {
    return modules.filter((m) => m.phase === phase && m.enabled).length > 0;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, phase: "Pre" | "Post") => {
    e.preventDefault();
    setDragOverPhase(phase);
  };

  const handleDrop = (toId: string) => {
    if (draggingId && draggingId !== toId) {
      onReorder(draggingId, toId);
    }
    setDraggingId(null);
    setDragOverPhase(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverPhase(null);
  };

  const categoryColors = {
    Security: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-400" },
    FinOps: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400" },
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Interactive Pipeline Flow</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Drag modules to reorder. Click toggle to enable/disable.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">{activeModules.length} Active</span>
          </div>
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <span className="text-xs font-mono text-[var(--accent-amber)]">+{totalLatency}ms</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Overview */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/50">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {/* Ingestion */}
          <div className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-[var(--accent-blue)]">
                <path d="M7 1v12M1 7l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] font-semibold text-[var(--text-muted)]">Input</span>
            </div>
            <div className="flex items-center w-4 shrink-0">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className="text-[var(--border)]">
                <path d="M1 1l4 2-4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Pre-flight */}
          <div className="flex items-center shrink-0">
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
              isStageActive("Pre")
                ? "bg-[var(--bg-elevated)] border-[var(--border)]"
                : "bg-[var(--bg-base)] border-[var(--border-subtle)]"
            }`}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className={isStageActive("Pre") ? "text-blue-400" : "text-[var(--text-muted)]"}>
                <path d="M7 1v10M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`text-[9px] font-semibold ${isStageActive("Pre") ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                Pre-flight
              </span>
              <span className="text-[8px] text-[var(--text-muted)]">{preModules.filter(m => m.enabled).length} active</span>
            </div>
            <div className="flex items-center w-4 shrink-0">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className={isStageActive("Pre") ? "text-[var(--border)]" : "text-[var(--border-subtle)]"}>
                <path d="M1 1l4 2-4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* API Call */}
          <div className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-[var(--accent-blue)]">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.5 7h5M9.5 7L7.5 5M9.5 7L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[9px] font-semibold text-[var(--text-muted)]">API Call</span>
            </div>
            <div className="flex items-center w-4 shrink-0">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className="text-[var(--border)]">
                <path d="M1 1l4 2-4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Post-flight */}
          <div className="flex items-center shrink-0">
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
              isStageActive("Post")
                ? "bg-[var(--bg-elevated)] border-[var(--border)]"
                : "bg-[var(--bg-base)] border-[var(--border-subtle)]"
            }`}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className={isStageActive("Post") ? "text-purple-400" : "text-[var(--text-muted)]"}>
                <path d="M7 13V1M1 7l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`text-[9px] font-semibold ${isStageActive("Post") ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                Post-flight
              </span>
              <span className="text-[8px] text-[var(--text-muted)]">{postModules.filter(m => m.enabled).length} active</span>
            </div>
            <div className="flex items-center w-4 shrink-0">
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className={isStageActive("Post") ? "text-[var(--border)]" : "text-[var(--border-subtle)]"}>
                <path d="M1 1l4 2-4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Output */}
          <div className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-[var(--accent-green)]">
                <path d="M7 13V1M1 7l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] font-semibold text-[var(--text-muted)]">Output</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Stages — Interactive */}
      <div className="p-5 space-y-5">
        {/* Pre-flight Modules */}
        <div
          onDragOver={(e) => handleDragOver(e, "Pre")}
          onDragLeave={() => setDragOverPhase(null)}
          onDrop={() => setDragOverPhase(null)}
          className={`border-2 rounded-xl p-4 transition-colors ${
            dragOverPhase === "Pre"
              ? "border-blue-400 bg-blue-500/5"
              : "border-[var(--border-subtle)] bg-[var(--bg-base)]/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-blue-400">
              <path d="M7 1v10M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Pre-flight Phase</span>
            <span className="text-[10px] text-[var(--text-muted)]">↓ Runs before API call</span>
          </div>

          {preModules.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-[var(--text-muted)] italic">
              No modules available in this phase
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preModules.map((m) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={() => setDraggingId(m.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(m.id)}
                  onDragEnd={handleDragEnd}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-move ${
                    m.enabled
                      ? "bg-[var(--bg-elevated)] border-[var(--border)]"
                      : "bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-50"
                  } ${draggingId === m.id ? "opacity-40 scale-95" : ""}`}
                >
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${categoryColors[m.category].bg} ${categoryColors[m.category].text} ${categoryColors[m.category].border}`}>
                    <span className={`w-0.5 h-0.5 rounded-full ${categoryColors[m.category].dot}`} />
                    {m.category}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post-flight Modules */}
        <div
          onDragOver={(e) => handleDragOver(e, "Post")}
          onDragLeave={() => setDragOverPhase(null)}
          onDrop={() => setDragOverPhase(null)}
          className={`border-2 rounded-xl p-4 transition-colors ${
            dragOverPhase === "Post"
              ? "border-purple-400 bg-purple-500/5"
              : "border-[var(--border-subtle)] bg-[var(--bg-base)]/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-purple-400">
              <path d="M7 13V1M1 7l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Post-flight Phase</span>
            <span className="text-[10px] text-[var(--text-muted)]">↑ Runs after API response</span>
          </div>

          {postModules.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-[var(--text-muted)] italic">
              No modules available in this phase
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {postModules.map((m) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={() => setDraggingId(m.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(m.id)}
                  onDragEnd={handleDragEnd}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-move ${
                    m.enabled
                      ? "bg-[var(--bg-elevated)] border-[var(--border)]"
                      : "bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-50"
                  } ${draggingId === m.id ? "opacity-40 scale-95" : ""}`}
                >
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${categoryColors[m.category].bg} ${categoryColors[m.category].text} ${categoryColors[m.category].border}`}>
                    <span className={`w-0.5 h-0.5 rounded-full ${categoryColors[m.category].dot}`} />
                    {m.category}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/50 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-red-400" />
          <span className="text-[10px] text-[var(--text-muted)]">Security modules</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-amber-400" />
          <span className="text-[10px] text-[var(--text-muted)]">FinOps modules</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-[var(--text-muted)]">💡 Drag modules to reorder · Use "Configure Modules" to toggle</span>
        </div>
      </div>
    </div>
  );
}