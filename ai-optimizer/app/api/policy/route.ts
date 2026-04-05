import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "data", "policy.json");

export async function GET() {
  try {
    const raw = readFileSync(FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[Policy GET] Error:", error);
    return NextResponse.json(
      { modules: [], failureMode: "open", updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = { ...body, updatedAt: new Date().toISOString() };
    writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ ok: true, updatedAt: data.updatedAt });
  } catch (error) {
    console.error("[Policy POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to save policy", ok: false },
      { status: 500 }
    );
  }
}
