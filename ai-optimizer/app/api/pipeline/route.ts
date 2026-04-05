import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

export type StepStatus = "passed" | "blocked" | "error" | "skipped" | "redacted";

export interface PipelineStep {
  moduleId: string;
  moduleName: string;
  status: StepStatus;
  latencyMs: number;
  details: Record<string, unknown>;
  outputPrompt: string;
}

export interface PipelineResult {
  originalPrompt: string;
  finalPrompt: string;
  blocked: boolean;
  blockedBy?: string;
  detectedLanguage?: string;
  steps: PipelineStep[];
  totalLatencyMs: number;
}

// ─── Thin fetch wrapper to the FastAPI backend ────────────────────────────────
async function callFastAPI(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(`${FASTAPI_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return {
      ok: false,
      status: 503,
      data: { detail: `Backend unreachable: ${message}` },
    };
  }
}

// ─── POST /api/pipeline ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { prompt, modules } = (await req.json()) as {
    prompt: string;
    modules: string[]; // ordered list of enabled module IDs
  };

  const steps: PipelineStep[] = [];
  let currentPrompt = prompt;
  let blocked = false;
  let blockedBy: string | undefined;
  let detectedLanguage: string | undefined;

  for (const moduleId of modules) {
    // ── Post-flight modules: runs on the LLM response, not the prompt ──
    if (moduleId === "reverse-translator" || moduleId === "data-exfiltration") {
      steps.push({
        moduleId,
        moduleName:
          moduleId === "reverse-translator"
            ? "Reverse Translator"
            : "Exfiltration Halt (DLP)",
        status: "skipped",
        latencyMs: 0,
        details: {
          note: "Post-flight module — runs on the LLM response, not the prompt.",
        },
        outputPrompt: currentPrompt,
      });
      continue;
    }

    const wallStart = Date.now();

    // ── Mathematical Perplexity Check ────────────────────────────────────────
    if (moduleId === "perplexity-check") {
      const { ok, data } = await callFastAPI("/v1/security/perplexity-check", {
        prompt: currentPrompt,
      });

      const latencyMs = Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "Mathematical Perplexity Check",
          status: "blocked",
          latencyMs,
          details: {
            perplexity: data.perplexity,
            reason: data.detail ?? "High token entropy detected (GCG attack suspected)",
          },
          outputPrompt: currentPrompt,
        });
        blocked = true;
        blockedBy = moduleId;
        break;
      }

      steps.push({
        moduleId,
        moduleName: "Mathematical Perplexity Check",
        status: "passed",
        latencyMs,
        details: {
          perplexity: data.perplexity ?? "N/A",
          threshold: "500.0",
          assessment: "Natural, non-adversarial text",
        },
        outputPrompt: currentPrompt,
      });
    }

    // ── Semantic Prompt Injection Firewall ────────────────────────────────────
    else if (moduleId === "llm-check") {
      const { ok, data } = await callFastAPI("/v1/security/llm-check", {
        prompt: currentPrompt,
      });

      const latencyMs = Date.now() - wallStart;
      const isBlocked = !ok;

      steps.push({
        moduleId,
        moduleName: "Semantic Prompt Injection Firewall",
        status: isBlocked ? "blocked" : "passed",
        latencyMs,
        details: {
          llm_verdict: data.llm_response ?? "NO",
          assessment: isBlocked ? "Jailbreak/injection pattern detected" : "Safe prompt intent",
        },
        outputPrompt: currentPrompt,
      });

      if (isBlocked) {
        blocked = true;
        blockedBy = moduleId;
        break;
      }
    }

    // ── Enterprise PII Scrubber ───────────────────────────────────────────────
    else if (moduleId === "pii-scrubber") {
      const { ok, data } = await callFastAPI("/v1/security/pii-scrub", {
        prompt: currentPrompt,
      });

      const latencyMs = Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "Enterprise PII Scrubber",
          status: "error",
          latencyMs,
          details: { error: data.detail ?? "Scrubbing failed" },
          outputPrompt: currentPrompt,
        });
        continue;
      }

      const redactedCount = (data.redacted_count as number) ?? 0;
      const safePrompt = (data.safe_prompt as string) ?? currentPrompt;

      steps.push({
        moduleId,
        moduleName: "Enterprise PII Scrubber",
        status: redactedCount > 0 ? "redacted" : "passed",
        latencyMs,
        details: {
          redacted_count: redactedCount,
          items: redactedCount > 0 ? `${redactedCount} sensitive item(s) replaced with placeholders` : "No PII detected",
          compliance: "SOC2/GDPR-compliant",
        },
        outputPrompt: safePrompt,
      });

      currentPrompt = safePrompt;
    }

    // ── Context Compressor (LLMLingua-2) ──────────────────────────────────────
    else if (moduleId === "context-compressor") {
      const { ok, data } = await callFastAPI("/v1/optimize/compress", {
        prompt: currentPrompt,
        target_rate: 0.5,
      });

      const latencyMs = Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "Context Compressor (LLMLingua-2)",
          status: "error",
          latencyMs,
          details: { error: data.detail ?? "Compression failed" },
          outputPrompt: currentPrompt,
        });
        continue;
      }

      const compressedText = (data.compressed_text as string) ?? currentPrompt;

      steps.push({
        moduleId,
        moduleName: "Context Compressor (LLMLingua-2)",
        status: "passed",
        latencyMs,
        details: {
          original_tokens: data.original_tokens,
          compressed_tokens: data.compressed_tokens,
          ratio: data.compression_ratio,
          saved: `${Math.round((1 - (data.compression_ratio as number)) * 100)}% tokens saved`,
        },
        outputPrompt: compressedText,
      });

      currentPrompt = compressedText;
    }

    // ── Auto-Translator to English ────────────────────────────────────────────
    else if (moduleId === "auto-translator") {
      const { ok, data } = await callFastAPI("/v1/optimize/translate", {
        prompt: currentPrompt,
      });

      const latencyMs = Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "Auto-Translator to English",
          status: "error",
          latencyMs,
          details: { error: data.detail ?? "Translation failed" },
          outputPrompt: currentPrompt,
        });
        continue;
      }

      const translated = (data.optimized_prompt as string) ?? currentPrompt;
      const wasTranslated = data.was_translated as boolean;
      detectedLanguage = data.detected_language as string;

      steps.push({
        moduleId,
        moduleName: "Auto-Translator to English",
        status: "passed",
        latencyMs,
        details: {
          was_translated: wasTranslated,
          detected_language: detectedLanguage,
          action: wasTranslated
            ? `Translated from "${detectedLanguage}" → English (3-4x token efficiency gain)`
            : "Already English — no translation needed",
        },
        outputPrompt: translated,
      });

      currentPrompt = translated;
    }
  }

  const result: PipelineResult = {
    originalPrompt: prompt,
    finalPrompt: currentPrompt,
    blocked,
    blockedBy,
    detectedLanguage,
    steps,
    totalLatencyMs: steps.reduce((s, st) => s + st.latencyMs, 0),
  };

  return NextResponse.json(result);
}
