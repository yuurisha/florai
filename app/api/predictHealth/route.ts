import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Optional: configure via env, fallback to your current local FastAPI
const FASTAPI_BASE = process.env.FASTAPI_URL ?? "http://127.0.0.1:8001";
const FASTAPI_URL = `${FASTAPI_BASE.replace(/\/$/, "")}/predict`;

type HealthLevel = "Healthy" | "Moderate" | "Unhealthy" | "Unknown";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Forward the file to FastAPI
    const fastApiForm = new FormData();
    fastApiForm.append("file", file, (file as any).name ?? "upload.jpg");

    let fastApiRes: Response;
    try {
      fastApiRes = await fetch(FASTAPI_URL, {
        method: "POST",
        body: fastApiForm,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: "Failed to reach FastAPI server",
          details: err?.message ?? String(err),
          fastApiUrl: FASTAPI_URL,
        },
        { status: 502 }
      );
    }

    const text = await fastApiRes.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "FastAPI returned non-JSON", raw: text },
        { status: 502 }
      );
    }

    if (!fastApiRes.ok) {
      return NextResponse.json(
        { error: data?.error || "FastAPI error", data },
        { status: fastApiRes.status }
      );
    }

    // ---- Normalize counts from FastAPI summary ----
    const healthy = Number(data?.summary?.healthy ?? 0);
    const diseased = Number(data?.summary?.diseased ?? 0);
    const total = healthy + diseased;

    // ---- Compute photo health score (incidence-style proxy) ----
    // Laplace smoothing to avoid 0%/100% when total is very small
    const alpha = 1;
    const photoHealth =
      total > 0 ? (healthy + alpha) / (total + 2 * alpha) : null;

    let healthLevel: HealthLevel = "Unknown";
    if (photoHealth !== null) {
      if (photoHealth >= 0.8) healthLevel = "Healthy";
      else if (photoHealth >= 0.6) healthLevel = "Moderate";
      else healthLevel = "Unhealthy";
    }

    // Optional: keep original status/class/confidence if FastAPI provides them
    const predictedClass = data?.status ?? "Unknown";
    const confidence =
  Array.isArray(data?.detections) && data.detections.length > 0
    ? Math.max(...data.detections.map((d: any) => Number(d?.confidence ?? 0)))
    : 0;
    return NextResponse.json({
      predictedClass,
      confidence,
      status: healthLevel, // computed label for the UI
      summary: { healthy, diseased, total },
      photoHealth, // 0..1 (or null)
      photoHealthPercent:
        photoHealth === null ? null : Math.round(photoHealth * 100),
      detections: data?.detections ?? null, // keep if you want to display boxes/list
      fastApiMeta: {
        ok: true,
        url: FASTAPI_URL,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
