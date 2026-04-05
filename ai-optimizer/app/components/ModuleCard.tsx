"use client";

import { DragEvent } from "react";

export interface Module {
  id: string;
  name: string;
  description: string;
  category: "Security" | "FinOps";
  phase: "Pre" | "Post";
  latencyMs: number;
  enabled: boolean;
}

interface ModuleCardProps {
  module: Module;
  stepNumber: number;
  onToggle: (id: string) => void;
  // drag-and-drop
  isDragging?: boolean;
  isDragOver?: boolean;
  isDropInvalid?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

const categoryConfig = {
  Security: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
  FinOps: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
};

const phaseConfig = {
  Pre: { text: "text-blue-400", label: "Pre-flight" },
  Post: { text: "text-purple-400", label: "Post-flight" },
};

export default function ModuleCard({
  module,
  stepNumber,
  onToggle,
  isDragging,
  isDragOver,
  isDropInvalid,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ModuleCardProps) {
  const cat = categoryConfig[module.category];
  const phase = phaseConfig[module.phase];

  let borderClass = module.enabled
    ? "border-[var(--border)] shadow-[0_0_0_1px_rgba(79,126,255,0.08)]"
    : "border-[var(--border-subtle)] hover:border-[var(--border)]";

  if (isDragOver && !isDropInvalid) {
    borderClass = "border-[var(--accent-blue)] shadow-[0_0_0_1px_rgba(79,126,255,0.3)]";
  } else if (isDragOver && isDropInvalid) {
    borderClass = "border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]";
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-150 ${
        module.enabled ? "bg-[var(--bg-elevated)]" : "bg-[var(--bg-surface)]"
      } ${borderClass} ${isDragging ? "opacity-40 scale-[0.98]" : "opacity-100 scale-100"}`}
    >
      {/* Drag handle — top-right */}
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="4" cy="3" r="1" /><circle cx="8" cy="3" r="1" />
          <circle cx="4" cy="6" r="1" /><circle cx="8" cy="6" r="1" />
          <circle cx="4" cy="9" r="1" /><circle cx="8" cy="9" r="1" />
        </svg>
      </div>

      {/* Drop invalid overlay */}
      {isDragOver && isDropInvalid && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-red-500/5 pointer-events-none">
          <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
            Security must precede FinOps
          </span>
        </div>
      )}

      {/* Header row: step badge + category + phase + toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Step number badge — top-left */}
          <span
            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
              module.enabled
                ? "bg-[var(--accent-blue-glow)] border-[rgba(79,126,255,0.3)] text-[var(--accent-blue)]"
                : "bg-[var(--bg-overlay)] border-[var(--border-subtle)] text-[var(--text-muted)]"
            }`}
          >
            {stepNumber}
          </span>

          {/* Category badge */}
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}>
            <span className={`w-1 h-1 rounded-full ${cat.dot}`} />
            {module.category}
          </span>

          <span className={`text-[10px] font-medium ${phase.text}`}>{phase.label}</span>
        </div>

        {/* Toggle */}
        <label
          className="toggle-switch shrink-0"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={module.enabled}
            onChange={() => onToggle(module.id)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Name + description */}
      <div className="cursor-pointer" onClick={() => onToggle(module.id)}>
        <h4 className={`text-sm font-semibold leading-tight transition-colors ${module.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
          {module.name}
        </h4>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
          {module.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className={`flex items-center gap-1.5 transition-all ${module.enabled ? "opacity-100" : "opacity-0"}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[var(--accent-amber)]">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-mono text-[var(--accent-amber)] latency-badge">
            +{module.latencyMs}ms
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">est. latency</span>
        </div>

        <div className={`flex items-center gap-1 transition-all ${module.enabled ? "opacity-100" : "opacity-30"}`}>
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${module.enabled ? "bg-[var(--accent-green)]" : "bg-[var(--text-muted)]"}`} />
          <span className="text-[10px] text-[var(--text-muted)]">{module.enabled ? "Active" : "Inactive"}</span>
        </div>
      </div>
    </div>
  );
}
