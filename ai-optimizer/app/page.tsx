"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import PipelineFlow from "./components/PipelineFlow";
import PolicyBuilder from "./components/PolicyBuilder";
import StatsPanel from "./components/StatsPanel";
import FailureMode from "./components/FailureMode";
import { Module } from "./components/ModuleCard";

// ─── Canonical module definitions (static metadata) ──────────────────────────
const MODULE_DEFS: Omit<Module, "enabled">[] = [
  { id: "pii-scrubber",       name: "PII Scrubber",             description: "Uses local regex to find emails, SSNs, or API keys in the prompt and replaces them with placeholders (e.g. <EMAIL_1>) before sending.",               category: "Security", phase: "Pre",  latencyMs: 5  },
  { id: "prompt-injection",   name: "Prompt Injection Filter",   description: "Runs the prompt against a lightweight local classifier to block known jailbreak phrases like \"Ignore all previous instructions\".",                       category: "Security", phase: "Pre",  latencyMs: 15 },
  { id: "context-compressor", name: "Context Compressor",        description: "Strips unnecessary whitespace, line breaks, and filler words to reduce the raw token count of massive text blocks.",                                        category: "FinOps",   phase: "Pre",  latencyMs: 3  },
  { id: "auto-translator",    name: "Auto-Translator",            description: "Detects non-English languages and translates them to English (the most token-efficient language) before sending to the LLM.",                              category: "FinOps",   phase: "Pre",  latencyMs: 50 },
  { id: "reverse-translator", name: "Reverse Translator",         description: "If Auto-Translator was triggered, catches the English response and translates it back to the user's original native language.",                            category: "FinOps",   phase: "Post", latencyMs: 50 },
  { id: "data-exfiltration",  name: "Data Exfiltration Halt",    description: "Scans the LLM's outgoing response for sensitive company data or unusually dense code blocks, blocking the response if it looks malicious.",               category: "Security", phase: "Post", latencyMs: 8  },
];

function buildModules(order: { id: string; enabled: boolean }[]): Module[] {
  return order
    .map(({ id, enabled }) => {
      const def = MODULE_DEFS.find((d) => d.id === id);
      if (!def) return null;
      return { ...def, enabled };
    })
    .filter(Boolean) as Module[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function Home() {
  const [modules, setModules] = useState<Module[]>(
    buildModules(MODULE_DEFS.map((d) => ({ id: d.id, enabled: d.id === "pii-scrubber" || d.id === "prompt-injection" })))
  );
  const [failureMode, setFailureMode] = useState<"open" | "closed">("open");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loaded, setLoaded] = useState(false);

  // Load saved policy on mount
  useEffect(() => {
    fetch("/api/policy")
      .then((r) => r.json())
      .then((data) => {
        if (data.modules) setModules(buildModules(data.modules));
        if (data.failureMode) setFailureMode(data.failureMode);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const savePolicy = useCallback(async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modules: modules.map((m) => ({ id: m.id, enabled: m.enabled })),
          failureMode,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [modules, failureMode]);

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const reorderModules = (fromId: string, toId: string) => {
    setModules((prev) => {
      const result = [...prev];
      const fromIdx = result.findIndex((m) => m.id === fromId);
      const toIdx = result.findIndex((m) => m.id === toId);
      [result[fromIdx], result[toIdx]] = [result[toIdx], result[fromIdx]];
      return result;
    });
  };

  const activeModuleIds = useMemo(
    () => new Set(modules.filter((m) => m.enabled).map((m) => m.id)),
    [modules]
  );

  const totalLatency = useMemo(
    () => modules.filter((m) => m.enabled).reduce((sum, m) => sum + m.latencyMs, 0),
    [modules]
  );

  const activeCount = modules.filter((m) => m.enabled).length;

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Dashboard</h1>
          <div className="h-3.5 w-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">Production</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
            activeCount === 0
              ? "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]"
              : "bg-[var(--accent-blue-glow)] border-[rgba(79,126,255,0.2)] text-[var(--accent-blue)]"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${activeCount === 0 ? "bg-[var(--text-muted)]" : "bg-[var(--accent-blue)] animate-pulse"}`} />
            {activeCount === 0 ? "Pass-through mode" : `${activeCount} module${activeCount !== 1 ? "s" : ""} active`}
          </div>
          <button
            onClick={savePolicy}
            disabled={saveState === "saving"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              saveState === "saving" ? "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
              : saveState === "saved"  ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : saveState === "error"  ? "bg-red-500/20 border border-red-500/30 text-red-400"
              : "bg-[var(--accent-blue)] text-white hover:bg-blue-500"
            }`}
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Error — retry?" : "Save Policy"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 space-y-5 fade-up transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}>
        <PipelineFlow activeModules={activeModuleIds} totalLatency={totalLatency} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <PolicyBuilder modules={modules} onToggle={toggleModule} onReorder={reorderModules} />

          <div className="space-y-4">
            <StatsPanel totalLatency={totalLatency} activeModules={activeCount} />
            <FailureMode mode={failureMode} onChange={setFailureMode} />

            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">API Endpoint</span>
                <button className="text-[10px] text-[var(--accent-blue)] hover:underline">Copy</button>
              </div>
              <div className="bg-[var(--bg-overlay)] rounded-lg px-3 py-2 font-mono text-[11px] text-[var(--text-muted)] break-all">
                https://api.ai-optimizer.dev/v1/chat
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Drop-in replacement for OpenAI&apos;s API. Point your SDK here to activate the pipeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
