"use client";

import { useState } from "react";

export default function TestingPage() {
  const [prompt, setPrompt] = useState("");
  const [module, setModule] = useState("pii-scrubber");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  const modules = [
    { id: "pii-scrubber", label: "PII Scrubber" },
    { id: "injection", label: "Prompt Injection Check" },
    { id: "perplexity", label: "Perplexity Check" },
    { id: "compression", label: "Context Compressor" },
    { id: "translator", label: "Auto-Translator" },
  ];

  const handleTest = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, module }),
      });

      const data = await res.json();
      setResult(data);
      setTestHistory([data, ...testHistory.slice(0, 9)]);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <h1 className="text-sm font-semibold text-[var(--text-primary)]">Prompt Testing</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Test Form */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-primary)] block mb-2">
              Select Module
            </label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-primary)] block mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a test prompt..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)] min-h-24 font-mono"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={!prompt.trim() || loading}
            className="w-full px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Testing..." : "Test Prompt"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-[var(--text-primary)]">Test Result</span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                  result.log?.status === "passed"
                    ? "bg-green-500/20 text-green-400"
                    : result.log?.status === "blocked"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {result.log?.status || "error"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {result.log && (
                <>
                  <div>
                    <span className="text-[var(--text-muted)]">Latency:</span>
                    <span className="text-[var(--text-primary)] ml-2 font-mono">
                      {result.log.latencyMs}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">ID:</span>
                    <span className="text-[var(--text-primary)] ml-2 font-mono">
                      {result.log.id}
                    </span>
                  </div>
                </>
              )}
              {result.response && (
                <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded border border-[var(--border)]">
                  <div className="text-[var(--text-muted)] mb-1">Response:</div>
                  <pre className="text-[var(--text-primary)] overflow-auto max-h-32 text-[10px]">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History */}
        {testHistory.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Test History</h2>
            <div className="space-y-2">
              {testHistory.map((entry) => (
                <div
                  key={entry.log?.id}
                  className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="text-xs text-[var(--text-muted)] mb-1 line-clamp-1">
                      {entry.log?.prompt || "Untitled"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                          entry.log?.status === "passed"
                            ? "bg-green-500/20 text-green-400"
                            : entry.log?.status === "blocked"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {entry.log?.status}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {entry.log?.latencyMs}ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
