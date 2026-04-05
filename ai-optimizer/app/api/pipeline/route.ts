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
    // ── Post-flight modules: no backend endpoint to call during a pre-flight test ──
    if (moduleId === "reverse-translator" || moduleId === "data-exfiltration") {
      steps.push({
        moduleId,
        moduleName:
          moduleId === "reverse-translator"
            ? "Reverse Translator"
            : "Data Exfiltration Halt",
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

    // ── PII Scrubber ─────────────────────────────────────────────────────────
    if (moduleId === "pii-scrubber") {
      const { ok, data } = await callFastAPI("/v1/security/pii-scrub", {
        prompt: currentPrompt,
      });

      const latencyMs =
        typeof data.processing_time_ms === "number"
          ? data.processing_time_ms
          : Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "PII Scrubber",
          status: "error",
          latencyMs,
          details: { error: data.detail ?? "Unknown error" },
          outputPrompt: currentPrompt,
        });
        continue;
      }

      const redactedCount = (data.redacted_count as number) ?? 0;
      const safePrompt = (data.safe_prompt as string) ?? currentPrompt;

      steps.push({
        moduleId,
        moduleName: "PII Scrubber",
        status: redactedCount > 0 ? "redacted" : "passed",
        latencyMs,
        details: {
          redacted_count: redactedCount,
          items: redactedCount > 0 ? `${redactedCount} item(s) replaced` : "No PII found",
        },
        outputPrompt: safePrompt,
      });

      currentPrompt = safePrompt;
    }

    // ── Prompt Injection Filter (perplexity check → semantic LLM check) ───────
    else if (moduleId === "prompt-injection") {
      // Step 1: GCG / perplexity attack detection
      const perplexRes = await callFastAPI("/v1/security/perplexity-check", {
        prompt: currentPrompt,
      });
      const perplexData = perplexRes.data;

      if (!perplexRes.ok) {
        steps.push({
          moduleId,
          moduleName: "Prompt Injection Filter",
          status: "blocked",
          latencyMs: Date.now() - wallStart,
          details: {
            check: "perplexity",
            perplexity: perplexData.perplexity,
            reason: perplexData.detail ?? "GCG / adversarial pattern detected",
          },
          outputPrompt: currentPrompt,
        });
        blocked = true;
        blockedBy = moduleId;
        break;
      }

      // Step 2: Semantic injection check
      const llmRes = await callFastAPI("/v1/security/llm-check", {
        prompt: currentPrompt,
      });
      const llmData = llmRes.data;
      const latencyMs = Date.now() - wallStart;

      if (!llmRes.ok) {
        steps.push({
          moduleId,
          moduleName: "Prompt Injection Filter",
          status: "blocked",
          latencyMs,
          details: {
            check: "semantic",
            perplexity: perplexData.perplexity,
            llm_verdict: "YES",
            reason: llmData.detail ?? "Semantic injection detected",
          },
          outputPrompt: currentPrompt,
        });
        blocked = true;
        blockedBy = moduleId;
        break;
      }

      steps.push({
        moduleId,
        moduleName: "Prompt Injection Filter",
        status: "passed",
        latencyMs,
        details: {
          perplexity: perplexData.perplexity,
          llm_verdict: llmData.llm_response ?? "NO",
          checks_run: "perplexity + semantic",
        },
        outputPrompt: currentPrompt,
      });
    }

    // ── Context Compressor ────────────────────────────────────────────────────
    else if (moduleId === "context-compressor") {
      const { ok, data } = await callFastAPI("/v1/optimize/compress", {
        prompt: currentPrompt,
        target_rate: 0.5,
      });

      const latencyMs =
        typeof data.processing_time_ms === "number"
          ? data.processing_time_ms
          : Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "Context Compressor",
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
        moduleName: "Context Compressor",
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

    // ── Auto-Translator ───────────────────────────────────────────────────────
    else if (moduleId === "auto-translator") {
      const { ok, data } = await callFastAPI("/v1/optimize/translate", {
        prompt: currentPrompt,
      });

      const latencyMs =
        typeof data.processing_time_ms === "number"
          ? data.processing_time_ms
          : Date.now() - wallStart;

      if (!ok) {
        steps.push({
          moduleId,
          moduleName: "Auto-Translator",
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
        moduleName: "Auto-Translator",
        status: "passed",
        latencyMs,
        details: {
          was_translated: wasTranslated,
          detected_language: detectedLanguage,
          action: wasTranslated
            ? `Translated from "${detectedLanguage}" → English`
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
