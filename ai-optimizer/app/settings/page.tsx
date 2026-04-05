"use client";

import { useState } from "react";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 py-6 border-b border-[var(--border-subtle)] last:border-b-0">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      {children}
      {description && <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-relaxed">{description}</p>}
    </div>
  );
}

function Input({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)] transition-colors"
    />
  );
}

function Select({ options, defaultValue }: { options: string[]; defaultValue: string }) {
  return (
    <select
      defaultValue={defaultValue}
      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] transition-colors appearance-none"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
      <div>
        <div className="text-xs font-medium text-[var(--text-secondary)]">{label}</div>
        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{description}</div>
      </div>
      <label className="toggle-switch shrink-0 mt-0.5">
        <input type="checkbox" checked={on} onChange={() => setOn(v => !v)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="bg-[var(--bg-base)] min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <h1 className="text-sm font-semibold text-[var(--text-primary)]">Settings</h1>
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            saved ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-[var(--accent-blue)] text-white hover:bg-blue-500"
          }`}
        >
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      <div className="max-w-4xl px-6 py-6 fade-up">

        <Section title="General" description="Basic information about your project and organization.">
          <Field label="Project name">
            <Input defaultValue="Production" />
          </Field>
          <Field label="Organization" description="Used for billing and team management.">
            <Input defaultValue="Acme Corp" />
          </Field>
          <Field label="Timezone">
            <Select options={["UTC", "US/Eastern", "US/Pacific", "Europe/London", "Asia/Tokyo"]} defaultValue="UTC" />
          </Field>
        </Section>

        <Section title="LLM Provider" description="Configure which upstream LLM provider your requests are forwarded to.">
          <Field label="Provider">
            <Select options={["OpenAI", "Anthropic", "Google Gemini", "Mistral", "Custom"]} defaultValue="OpenAI" />
          </Field>
          <Field label="Model" description="Default model used when none is specified in the request.">
            <Select options={["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "claude-3-5-sonnet", "gemini-1.5-pro"]} defaultValue="gpt-4o" />
          </Field>
          <Field label="Target base URL" description="Override the upstream API base URL. Leave blank to use the provider default.">
            <Input placeholder="https://api.openai.com/v1" />
          </Field>
          <Field label="Request timeout (ms)" description="How long to wait for the LLM before returning a timeout error.">
            <Input defaultValue="30000" />
          </Field>
        </Section>

        <Section title="Pipeline Defaults" description="Global defaults for pipeline behavior across all requests.">
          <Field label="Default failure mode" description="What to do when a module crashes or times out.">
            <Select options={["Fail Open (bypass module)", "Fail Closed (block request)"]} defaultValue="Fail Open (bypass module)" />
          </Field>
          <Field label="Max overhead budget (ms)" description="Requests exceeding this pipeline latency will skip non-critical modules.">
            <Input defaultValue="200" />
          </Field>
          <Toggle label="Log all requests" description="Store request metadata (prompt preview, latency, modules fired) in the Request Logs table." defaultChecked={true} />
          <Toggle label="Log prompt content" description="Include a truncated prompt preview in logs. Disable for maximum privacy." defaultChecked={true} />
        </Section>

        <Section title="Security" description="Controls for tightening security posture across your pipeline.">
          <Toggle label="Enforce PII scrubbing on all keys" description="Apply PII Scrubber regardless of per-key policy." />
          <Toggle label="Block requests without X-AIO-Key" description="Reject any request missing a valid AI Optimizer API key." defaultChecked={true} />
          <Toggle label="Rate limiting" description="Enforce per-key rate limits to prevent abuse." defaultChecked={true} />
          <Field label="Rate limit (req/min)" description="Maximum requests per minute per API key.">
            <Input defaultValue="1000" />
          </Field>
        </Section>

        <Section title="Notifications" description="Configure alerts for security events and anomalies.">
          <Toggle label="Email on injection blocked" description="Send an email when a prompt injection attempt is detected." />
          <Toggle label="Email on exfiltration halted" description="Send an email when a data exfiltration attempt is blocked." defaultChecked={true} />
          <Field label="Alert email address">
            <Input placeholder="alerts@yourcompany.com" />
          </Field>
          <Field label="Webhook URL" description="POST security events to this endpoint as JSON.">
            <Input placeholder="https://hooks.slack.com/services/..." />
          </Field>
        </Section>

        {/* Danger zone */}
        <div className="mt-6 p-5 rounded-xl border border-red-500/20 bg-red-500/5">
          <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
          <p className="text-[11px] text-[var(--text-muted)] mb-4 leading-relaxed">These actions are irreversible. Proceed with caution.</p>
          <div className="space-y-3">
            {[
              { label: "Reset all policies", desc: "Disable all modules and revert to pass-through mode." },
              { label: "Revoke all API keys", desc: "Immediately invalidate every active key. Requests will fail until new keys are issued." },
              { label: "Delete project", desc: "Permanently delete this project, all keys, logs, and configuration." },
            ].map(action => (
              <div key={action.label} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div>
                  <div className="text-xs font-medium text-[var(--text-secondary)]">{action.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{action.desc}</div>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors shrink-0 ml-4">
                  {action.label.split(" ")[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
