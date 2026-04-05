"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import PolicyBuilder from "../components/PolicyBuilder";
import PipelineTest from "../components/PipelineTest";
import { Module } from "../components/ModuleCard";

// ─── Canonical module definitions (static metadata) ───────────────────────────
const MODULE_DEFS: Omit<Module, "enabled">[] = [
  { id: "pii-scrubber",       name: "PII Scrubber",             description: "Uses local regex to find emails, SSNs, or API keys in the prompt and replaces them with placeholders (e.g. <EMAIL_1>) before sending.",               category: "Security", phase: "Pre",  latencyMs: 5  },
  { id: "prompt-injection",   name: "Prompt Injection Filter",   description: "Runs the prompt against a lightweight local classifier to block known jailbreak phrases like \"Ignore all previous instructions\".",                       category: "Security", phase: "Pre",  latencyMs: 15 },
  { id: "context-compressor", name: "Context Compressor",        description: "Strips unnecessary whitespace, line breaks, and filler words to reduce the raw token count of massive text blocks.",                                        category: "FinOps",   phase: "Pre",  latencyMs: 3  },
  { id: "auto-translator",    name: "Auto-Translator",            description: "Detects non-English languages and translates them to English (the most token-efficient language) before sending to the LLM.",                              category: "FinOps",   phase: "Pre",  latencyMs: 50 },
  { id: "reverse-translator", name: "Reverse Translator",         description: "If Auto-Translator was triggered, catches the English response and translates it back to the user's original native language.",                            category: "FinOps",   phase: "Post", latencyMs: 50 },
  { id: "data-exfiltration",  name: "Data Exfiltration Halt",    description: "Scans the LLM's outgoing response for sensitive company data or unusually dense code blocks, blocking the response if it looks malicious.",               category: "Security", phase: "Post", latencyMs: 8  },
];

function buildModules(
  order: { id: string; enabled: boolean }[]
): Module[] {
  return order
    .map(({ id, enabled }) => {
      const def = MODULE_DEFS.find((d) => d.id === id);
      if (!def) return null;
      return { ...def, enabled };
    })
    .filter(Boolean) as Module[];
}

// ─── Config preview ───────────────────────────────────────────────────────────
function ConfigPreview({
  modules,
  failureMode,
}: {
  modules: Module[];
  failureMode: string;
}) {
  const config = {
    version: "1.0",
    pipeline: {
      pre:  modules.filter((m) => m.phase === "Pre"  && m.enabled).map((m) => ({ module: m.id, enabled: true })),
      post: modules.filter((m) => m.phase === "Post" && m.enabled).map((m) => ({ module: m.id, enabled: true })),
    },
    failureMode,
    target: "https://api.openai.com/v1/chat/completions",
  };
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden h-fit">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs font-semibold text-[var(--text-primary)]">Config Preview</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">pipeline.json</span>
        </div>
      </div>
      <pre className="p-4 text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed overflow-auto max-h-[420px] bg-[var(--bg-base)]">
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type SaveState = "idle" | "saving" | "saved" | "error";

export default function PolicyBuilderPage() {
  const [modules, setModules] = useState<Module[]>(buildModules(
    MODULE_DEFS.map((d) => ({ id: d.id, enabled: d.id === "pii-scrubber" || d.id === "prompt-injection" }))
  ));
  const [failureMode, setFailureMode] = useState<"open" | "closed">("open");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ── Load saved policy on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/policy")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const contentType = r.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid response format");
        }
        return r.json();
      })
      .then((data) => {
        // Only update modules if they exist and are non-empty
        if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
          setModules(buildModules(data.modules));
        }
        if (data.failureMode) setFailureMode(data.failureMode);
        if (data.updatedAt) setLastSaved(new Date(data.updatedAt).toLocaleString());
        setLoaded(true);
      })
      .catch((err) => {
        console.warn("Failed to load policy, using defaults:", err);
        setLoaded(true);
      });
  }, []);

  const totalLatency = useMemo(
    () => modules.filter((m) => m.enabled).reduce((sum, m) => sum + m.latencyMs, 0),
    [modules]
  );

  const toggleModule = (id: string) =>
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));

  const reorderModules = (fromId: string, toId: string) => {
    setModules((prev) => {
      const result = [...prev];
      const fi = result.findIndex((m) => m.id === fromId);
      const ti = result.findIndex((m) => m.id === toId);
      [result[fi], result[ti]] = [result[ti], result[fi]];
      return result;
    });
  };

  // ── Save policy ─────────────────────────────────────────────────────────────
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
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }
      const data = await res.json();
      if (!data.updatedAt) {
        throw new Error("Invalid response structure");
      }
      setLastSaved(new Date(data.updatedAt).toLocaleString());
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      console.error("Policy save error:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [modules, failureMode]);

  // ── Export JSON ─────────────────────────────────────────────────────────────
  const exportJson = () => {
    const config = {
      version: "1.0",
      pipeline: {
        pre:  modules.filter((m) => m.phase === "Pre"  && m.enabled).map((m) => ({ module: m.id, enabled: true })),
        post: modules.filter((m) => m.phase === "Post" && m.enabled).map((m) => ({ module: m.id, enabled: true })),
      },
      failureMode,
      target: "https://api.openai.com/v1/chat/completions",
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveLabel =
    saveState === "saving" ? "Saving…"
    : saveState === "saved"  ? "Saved!"
    : saveState === "error"  ? "Error — retry?"
    : "Save Policy";

  const saveCls =
    saveState === "saving" ? "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
    : saveState === "saved"  ? "bg-green-500/20 border border-green-500/30 text-green-400"
    : saveState === "error"  ? "bg-red-500/20 border border-red-500/30 text-red-400"
    : "bg-[var(--accent-blue)] text-white hover:bg-blue-500";

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Policy Builder</h1>
          <div className="h-3.5 w-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">Production</span>
          {totalLatency > 0 && (
            <>
              <div className="h-3.5 w-px bg-[var(--border)]" />
              <span className="text-xs font-mono text-amber-400">+{totalLatency}ms overhead</span>
            </>
          )}
          {lastSaved && (
            <>
              <div className="h-3.5 w-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--text-muted)]">Last saved {lastSaved}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            Export JSON
          </button>
          <button
            onClick={savePolicy}
            disabled={saveState === "saving"}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${saveCls}`}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      <div className={`p-6 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}>
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--accent-blue-glow)] border border-[rgba(79,126,255,0.2)] mb-5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--accent-blue)] mt-0.5 shrink-0">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-xs font-medium text-[var(--accent-blue)]">Pass-through default</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              When all modules are off, the pipeline acts as a transparent proxy. Toggle modules on to activate middleware. Step numbers show execution order.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <PolicyBuilder modules={modules} onToggle={toggleModule} onReorder={reorderModules} />

          <div className="space-y-4">
            <ConfigPreview modules={modules} failureMode={failureMode} />

            {/* Failure mode selector */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Failure Mode</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["open", "closed"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFailureMode(m)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      failureMode === m
                        ? m === "open"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border)]"
                    }`}
                  >
                    <div className="text-xs font-semibold capitalize">Fail {m}</div>
                    <div className="text-[10px] mt-0.5 leading-relaxed opacity-70">
                      {m === "open" ? "Bypass module, keep app alive." : "Block request, max security."}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Latency budget */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Latency Budget</span>
                <span className={`text-xs font-mono ${totalLatency > 100 ? "text-amber-400" : "text-[var(--accent-green)]"}`}>
                  {totalLatency}ms / 200ms
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalLatency > 150 ? "bg-red-400" : totalLatency > 80 ? "bg-amber-400" : "bg-[var(--accent-green)]"
                  }`}
                  style={{ width: `${Math.min((totalLatency / 200) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {modules.filter((m) => m.enabled).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[var(--bg-overlay)] text-[9px] font-bold text-[var(--text-muted)] flex items-center justify-center shrink-0">
                      {modules.indexOf(m) + 1}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex-1">{m.name}</span>
                    <span className="text-[11px] font-mono text-amber-400">+{m.latencyMs}ms</span>
                  </div>
                ))}
                {modules.filter((m) => m.enabled).length === 0 && (
                  <p className="text-[11px] text-[var(--text-muted)] italic">No active modules</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live pipeline test */}
        <div className="mt-5">
          <PipelineTest modules={modules} />
        </div>
      </div>
    </main>
  );
}
