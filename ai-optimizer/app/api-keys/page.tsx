"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  requests: number;
  status: "active" | "revoked";
}

const initialKeys: ApiKey[] = [
  { id: "k1", name: "Production App", prefix: "aio_prod_7f2k", created: "Mar 1, 2026", lastUsed: "Just now", requests: 18432, status: "active" },
  { id: "k2", name: "Dev Environment", prefix: "aio_dev_3a9x",  created: "Mar 15, 2026", lastUsed: "2h ago",   requests: 4201,  status: "active" },
  { id: "k3", name: "CI Pipeline",     prefix: "aio_ci_8m1q",   created: "Mar 22, 2026", lastUsed: "1d ago",   requests: 890,   status: "active" },
  { id: "k4", name: "Staging",         prefix: "aio_stg_2b6n",  created: "Feb 10, 2026", lastUsed: "5d ago",   requests: 3102,  status: "revoked" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-[10px] text-[var(--accent-blue)] hover:underline transition-all"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const revoke = (id: string) =>
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: "revoked" } : k));

  const createKey = () => {
    if (!newName.trim()) return;
    const prefix = `aio_${newName.toLowerCase().replace(/\s+/g, "_").slice(0, 6)}_${Math.random().toString(36).slice(2, 6)}`;
    const fullKey = `${prefix}${"x".repeat(32)}`;
    setNewKeyValue(fullKey);
    setKeys(prev => [{
      id: `k${Date.now()}`, name: newName, prefix, created: "Apr 4, 2026",
      lastUsed: "Never", requests: 0, status: "active",
    }, ...prev]);
  };

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">API Keys</h1>
          <div className="h-3.5 w-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">{keys.filter(k => k.status === "active").length} active</span>
        </div>
        <button
          onClick={() => { setShowModal(true); setNewName(""); setNewKeyValue(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-medium hover:bg-blue-500 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Create Key
        </button>
      </div>

      <div className="p-6 space-y-5 fade-up">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-amber-400 shrink-0 mt-0.5">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            API keys grant full access to your pipeline. Keep them secret. Pass as <span className="font-mono text-[var(--text-secondary)]">Authorization: Bearer &lt;key&gt;</span> in your requests.
          </p>
        </div>

        {/* Keys table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_180px_100px_100px_80px_80px] gap-3 px-4 py-2.5 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            {["Name", "Key", "Created", "Last Used", "Requests", ""].map((h, i) => (
              <span key={i} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {keys.map(key => (
            <div key={key.id} className={`grid grid-cols-[1fr_180px_100px_100px_80px_80px] gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] items-center ${key.status === "revoked" ? "opacity-40" : ""}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${key.status === "active" ? "bg-green-400" : "bg-[var(--text-muted)]"}`} />
                <span className="text-sm font-medium text-[var(--text-primary)]">{key.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[var(--text-muted)]">{key.prefix}••••</span>
                {key.status === "active" && <CopyButton text={`${key.prefix}xxxx`} />}
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">{key.created}</span>
              <span className="text-[11px] text-[var(--text-muted)]">{key.lastUsed}</span>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">{key.requests.toLocaleString()}</span>
              <div>
                {key.status === "active" ? (
                  <button
                    onClick={() => revoke(key.id)}
                    className="text-[11px] text-red-400 hover:text-red-300 hover:underline transition-colors"
                  >
                    Revoke
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)]">Revoked</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Usage summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total API calls", value: keys.reduce((s, k) => s + k.requests, 0).toLocaleString() },
            { label: "Active keys", value: keys.filter(k => k.status === "active").length.toString() },
            { label: "Revoked keys", value: keys.filter(k => k.status === "revoked").length.toString() },
          ].map(s => (
            <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="text-xl font-bold text-[var(--text-primary)]">{s.value}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Create key modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Create API Key</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {!newKeyValue ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block mb-1.5">Key name</label>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Production App"
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)] transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Cancel</button>
                  <button onClick={createKey} disabled={!newName.trim()} className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-40 transition-all">Create Key</button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-green-400 shrink-0 mt-0.5"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <p className="text-[11px] text-green-400">Key created. Copy it now — you won&apos;t see it again.</p>
                </div>
                <div className="bg-[var(--bg-overlay)] rounded-lg p-3 font-mono text-[11px] text-[var(--text-secondary)] break-all">
                  {newKeyValue}
                </div>
                <div className="flex gap-2">
                  <CopyButton text={newKeyValue} />
                  <button onClick={() => setShowModal(false)} className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
