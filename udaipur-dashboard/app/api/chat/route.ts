import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 175000);

    let backendRes: Response;

    if (contentType.includes("multipart/form-data")) {
      // Forward multipart (file uploads) directly
      const formData = await req.formData();
      backendRes = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } else {
      // JSON path (legacy / mock mode)
      const body = await req.json();
      backendRes = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend error ${backendRes.status}`, detail: text },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("abort"));

    return NextResponse.json({
      reply: isAbort
        ? "⏱️ The AI agent timed out (>2 min). Try a shorter question or retry."
        : "⚠️ Could not reach the AI backend. Make sure uvicorn is running on port 8000.",
      tools_used: [],
      thinking_steps: [],
    });
  }
}
