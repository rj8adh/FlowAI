"use client";

import { useState, DragEvent } from "react";
import ModuleCard, { Module } from "./ModuleCard";

interface PolicyBuilderProps {
  modules: Module[];
  onToggle: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

function isValidSwap(a: Module, b: Module): boolean {
  return a.phase === b.phase && a.category === b.category;
}

function PhaseSection({
  label,
  sublabel,
  labelColor,
  icon,
  modules,
  stepOffset,
  draggingId,
  dragOverId,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  label: string;
  sublabel: string;
  labelColor: string;
  icon: React.ReactNode;
  modules: Module[];
  stepOffset: number;
  draggingId: string | null;
  dragOverId: string | null;
  onToggle: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDrop: (toId: string) => void;
  onDragEnd: () => void;
}) {
  const draggingModule = draggingId ? modules.find((m) => m.id === draggingId) : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>{label}</span>
        </div>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-[10px] text-[var(--text-muted)]">{sublabel}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map((m, idx) => {
          const over = dragOverId === m.id && draggingId !== m.id;
          const invalid = over && draggingModule ? !isValidSwap(draggingModule, m) : false;
          return (
            <ModuleCard
              key={m.id}
              module={m}
              stepNumber={stepOffset + idx + 1}
              onToggle={onToggle}
              isDragging={draggingId === m.id}
              isDragOver={over}
              isDropInvalid={invalid}
              onDragStart={() => onDragStart(m.id)}
              onDragOver={(e) => onDragOver(e, m.id)}
              onDrop={() => onDrop(m.id)}
              onDragEnd={onDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function PolicyBuilder({ modules, onToggle, onReorder }: PolicyBuilderProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const preModules = modules.filter((m) => m.phase === "Pre");
  const postModules = modules.filter((m) => m.phase === "Post");
  const activeCount = modules.filter((m) => m.enabled).length;

  const handleDragOver = (e: DragEvent<HTMLDivElement>, toId: string) => {
    e.preventDefault();
    setDragOverId(toId);
  };

  const handleDrop = (toId: string) => {
    if (draggingId && draggingId !== toId) {
      const from = modules.find((m) => m.id === draggingId)!;
      const to = modules.find((m) => m.id === toId)!;
      if (isValidSwap(from, to)) onReorder(draggingId, toId);
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Configure Modules</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Drag to reorder within each phase. Toggle on/off to include in pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{activeCount}/{modules.length} active</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Pre-flight — steps 1…preModules.length */}
        <PhaseSection
          label="Pre-flight"
          sublabel="Runs before API call"
          labelColor="text-blue-400"
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-blue-400">
              <path d="M6 1v10M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          modules={preModules}
          stepOffset={0}
          draggingId={draggingId}
          dragOverId={dragOverId}
          onToggle={onToggle}
          onDragStart={setDraggingId}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />

        {/* Post-flight — steps preModules.length+1…total */}
        <PhaseSection
          label="Post-flight"
          sublabel="Runs after API response"
          labelColor="text-purple-400"
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-purple-400">
              <path d="M6 11V1M1 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          modules={postModules}
          stepOffset={preModules.length}
          draggingId={draggingId}
          dragOverId={dragOverId}
          onToggle={onToggle}
          onDragStart={setDraggingId}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  );
}
