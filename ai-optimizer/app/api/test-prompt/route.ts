import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PYTHON_API_BASE = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, module } = body;

    if (!prompt || !module) {
      return NextResponse.json(
        { error: "Missing prompt or module" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let response: any;
    let status: "passed" | "blocked" | "error" = "passed";

    // Call the appropriate backend endpoint based on module
    try {
      const moduleEndpoints: Record<string, string> = {
        "perplexity-check": "/v1/security/perplexity-check",
        "llm-check": "/v1/security/llm-check",
        "pii-scrubber": "/v1/security/pii-scrub",
        "context-compressor": "/v1/optimize/compress",
        "auto-translator": "/v1/optimize/translate",
        "reverse-translator": "/v1/post-process/translate-back",
        "data-exfiltration": "/v1/security/exfiltration-check",
      };

      const endpoint = moduleEndpoints[module] || "/v1/security/pii-scrub";
      
      const res = await fetch(`${PYTHON_API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      response = await res.json();

      if (!res.ok) {
        status = "blocked";
      }
    } catch (error) {
      status = "error";
      response = { error: String(error) };
    }

    const latencyMs = Date.now() - startTime;

    // Create log entry
    const logEntry = {
      model: "backend-api",
      status,
      modules: [module],
      latencyMs,
      overheadMs: Math.max(0, latencyMs - 50),
      tokensIn: Math.ceil(prompt.split(" ").length * 1.3),
      tokensOut: response?.compressed_tokens || response?.result?.length || 0,
      prompt,
    };

    // Save to logs.json
    const filePath = join(process.cwd(), "data", "logs.json");
    let data = { logs: [] };
    try {
      const raw = readFileSync(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch (e) {}

    const newLog = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      ...logEntry,
    };

    data.logs.unshift(newLog);
    data.logs = data.logs.slice(0, 100);

    writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      log: newLog,
      response,
    });
  } catch (error) {
    console.error("[Test Prompt] Error:", error);
    return NextResponse.json(
      { error: "Failed to test prompt" },
      { status: 500 }
    );
  }
}
