"use client";

import { useState } from "react";

const sections = [
  { id: "quickstart", label: "Quickstart" },
  { id: "endpoint",   label: "API Endpoint" },
  { id: "modules",    label: "Pipeline Modules" },
  { id: "headers",    label: "Request Headers" },
  { id: "responses",  label: "Response Format" },
  { id: "errors",     label: "Error Handling" },
];

function Code({ lang, children }: { lang: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
        <span className="text-[10px] font-mono text-[var(--text-muted)]">{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[10px] text-[var(--accent-blue)] hover:underline"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 bg-[var(--bg-base)] text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed overflow-x-auto">
        {children.trim()}
      </pre>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-[var(--text-primary)] mt-8 mb-3 pt-6 border-t border-[var(--border-subtle)] first:border-t-0 first:mt-0 first:pt-0">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-5 mb-2">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{children}</p>;
}
function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "red" | "amber" }) {
  const cls = { blue: "bg-blue-500/10 text-blue-400 border-blue-500/20", green: "bg-green-500/10 text-green-400 border-green-500/20", red: "bg-red-500/10 text-red-400 border-red-500/20", amber: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border font-mono ${cls[color]}`}>{children}</span>;
}

export default function DocsPage() {
  const [active, setActive] = useState("quickstart");

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Documentation</h1>
          <div className="h-3.5 w-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">API Reference v1.0</span>
        </div>
      </div>

      <div className="flex">
        {/* Docs sidebar */}
        <nav className="w-48 shrink-0 border-r border-[var(--border)] py-5 px-3 space-y-0.5 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto bg-[var(--bg-surface)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2">On this page</p>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                active === s.id
                  ? "bg-[var(--accent-blue-glow)] text-[var(--accent-blue)] border border-[rgba(79,126,255,0.2)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Docs content */}
        <div className="flex-1 max-w-3xl px-8 py-6 fade-up">

          <H2>Quickstart</H2>
          <P>AI Optimizer is a drop-in middleware proxy for any OpenAI-compatible API. Point your SDK at our endpoint and enable modules via the Policy Builder. No SDK changes required.</P>

          <H3>1. Get your API key</H3>
          <P>Create an API key from the <span className="text-[var(--text-secondary)]">API Keys</span> page. Pass it as a Bearer token.</P>

          <H3>2. Update your base URL</H3>
          <Code lang="python">
{`import openai

client = openai.OpenAI(
    api_key="your-openai-key",
    base_url="https://api.ai-optimizer.dev/v1",
    default_headers={
        "X-AIO-Key": "aio_prod_7f2k••••",
    }
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
`}
          </Code>

          <Code lang="typescript">
{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.ai-optimizer.dev/v1",
  defaultHeaders: {
    "X-AIO-Key": process.env.AIO_KEY,
  },
});
`}
          </Code>

          <H3>3. Enable modules</H3>
          <P>Go to the Policy Builder and toggle the modules you want. They apply to every request through this key, instantly — no redeploy needed.</P>

          <H2>API Endpoint</H2>
          <P>The proxy exposes a single endpoint that mirrors OpenAI&apos;s chat completions API exactly.</P>
          <Code lang="http">
{`POST https://api.ai-optimizer.dev/v1/chat/completions

Authorization: Bearer <your-openai-key>
X-AIO-Key: <your-aio-key>
Content-Type: application/json`}
          </Code>

          <H2>Pipeline Modules</H2>
          <P>Modules run in order: Pre-flight → LLM → Post-flight. You control which modules are active via the Policy Builder.</P>

          <div className="mt-4 space-y-3">
            {[
              { name: "PII Scrubber", phase: "Pre", cat: "Security", latency: "~5ms", desc: "Replaces emails, SSNs, and API keys with placeholders before the prompt is sent." },
              { name: "Prompt Injection Filter", phase: "Pre", cat: "Security", latency: "~15ms", desc: "Classifies and blocks known jailbreak patterns." },
              { name: "Context Compressor", phase: "Pre", cat: "FinOps", latency: "~3ms", desc: "Strips filler tokens to reduce billing costs." },
              { name: "Auto-Translator", phase: "Pre", cat: "FinOps", latency: "~50ms", desc: "Translates non-English prompts to English before sending." },
              { name: "Reverse Translator", phase: "Post", cat: "FinOps", latency: "~50ms", desc: "Translates the English response back to the user's language." },
              { name: "Data Exfiltration Halt", phase: "Post", cat: "Security", latency: "~8ms", desc: "Blocks responses containing sensitive or anomalous data." },
            ].map(m => (
              <div key={m.name} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex flex-col gap-1 pt-0.5">
                  <Badge color={m.cat === "Security" ? "red" : "amber"}>{m.cat}</Badge>
                  <Badge color={m.phase === "Pre" ? "blue" : "blue"}>{m.phase}-flight</Badge>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{m.name}</span>
                    <span className="text-[10px] font-mono text-amber-400">{m.latency}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <H2>Request Headers</H2>
          <div className="mt-3 rounded-xl border border-[var(--border)] overflow-hidden">
            {[
              { header: "Authorization", required: true, desc: "Your OpenAI API key. Forwarded to the LLM." },
              { header: "X-AIO-Key", required: true, desc: "Your AI Optimizer API key. Used for policy lookup and billing." },
              { header: "X-AIO-Fail-Mode", required: false, desc: "open or closed. Overrides the dashboard setting per-request." },
              { header: "X-AIO-Skip-Modules", required: false, desc: "Comma-separated module IDs to skip for this request only." },
            ].map(h => (
              <div key={h.header} className="grid grid-cols-[180px_60px_1fr] gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0">
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">{h.header}</span>
                <span className={`text-[10px] font-semibold ${h.required ? "text-red-400" : "text-[var(--text-muted)]"}`}>{h.required ? "required" : "optional"}</span>
                <span className="text-[11px] text-[var(--text-muted)]">{h.desc}</span>
              </div>
            ))}
          </div>

          <H2>Response Format</H2>
          <P>Responses are identical to OpenAI&apos;s format, with extra metadata in a top-level <Badge>x_aio</Badge> field.</P>
          <Code lang="json">
{`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "choices": [ ... ],
  "usage": { "prompt_tokens": 42, "completion_tokens": 128 },
  "x_aio": {
    "modules_fired": ["pii-scrubber", "perplexity-check", "llm-check"],
    "overhead_ms": 20,
    "pii_replacements": 2,
    "blocked": false
  }
}`}
          </Code>

          <H2>Error Handling</H2>
          <P>When a module blocks a request, the proxy returns a <Badge color="red">403</Badge> with a structured error body instead of forwarding to the LLM.</P>
          <Code lang="json">
{`{
  "error": {
    "type": "pipeline_blocked",
    "module": "llm-check",
    "message": "Request blocked by Semantic Prompt Injection Firewall.",
    "code": 403
  }
}`}
          </Code>
          <P>If <Badge>X-AIO-Fail-Mode: open</Badge> is set and a module crashes, the request is forwarded unmodified. With <Badge>closed</Badge>, a <Badge color="red">502</Badge> is returned.</P>

        </div>
      </div>
    </main>
  );
}
