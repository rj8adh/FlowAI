import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "data", "logs.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Logs GET] Error:", error);
    return NextResponse.json({ logs: [] }, { status: 200 });
  }
}
