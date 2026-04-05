import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filePath = join(process.cwd(), "data", "logs.json");
    
    // Read existing logs
    let data = { logs: [] };
    try {
      const raw = readFileSync(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch (e) {
      // File doesn't exist yet, use empty structure
    }
    
    // Add new log entry
    const newLog = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      ...body,
    };
    
    data.logs.unshift(newLog); // Add to front of array
    data.logs = data.logs.slice(0, 100); // Keep only last 100 logs
    
    // Write back to file
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error("[Logs POST] Error:", error);
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}
