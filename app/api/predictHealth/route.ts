import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HealthLevel = "Healthy" | "Moderate" | "Unhealthy" | "Unknown";

// FASTAPI_BASE_URL = https://florai-0o6p.onrender.com
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function POST(req: Request) {
  try {
    if (!FASTAPI_BASE_URL) {
      return NextResponse.json(
        {
          error: "Missing FASTAPI_BASE_URL env var",
          hint: "Set FASTAPI_BASE_URL in Vercel to your Render URL (e.g. https://florai-0o6p.onrender.com)",
        },
        { status: 500 }
      );
    }

    const FASTAPI_URL = joinUrl(FASTAPI_BASE_URL, "/predict");

    // Read incoming multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded (expected form-data key: 'file')" },
        { status: 400 }
      );
    }

    // Forward the file to FastAPI (same field name: "file")
    const fastApiForm = new FormData();
    fastApiForm.append("file", file, file.name || "upload.jpg");

    let fastApiRes: Response;
    try {
      fastApiRes = await fetch(FASTAPI_URL, {
        method: "POST",
        body: fastApiForm,
        // DO NOT set Content-Type manually for FormData (browser/node will set boundary)
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: "Failed to reach FastAPI server",
          details: msg,
          fastApiUrl: FASTAPI_URL,
        },
        { status: 502 }
      );
    }

    const raw = await fastApiRes.text();

    // Try parse JSON; if not JSON, return raw text
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return NextResponse.json(
        {
          error: "FastAPI returned non-JSON response",
          status: fastApiRes.status,
          raw,
          fastApiUrl: FASTAPI_URL,
        },
        { status: 502 }
      );
    }

    if (!fastApiRes.ok) {
      return NextResponse.json(
        {
          error: data?.error || "FastAPI error",
          status: fastApiRes.status,
          data,
          fastApiUrl: FASTAPI_URL,
        },
        { status: fastApiRes.status }
      );
    }

    // ---- Normalize counts from FastAPI summary ----
    const healthy = Number(data?.summary?.healthy ?? 0);
    const diseased = Number(data?.summary?.diseased ?? 0);
    const total = healthy + diseased;

    
    // Laplace smoothing to avoid 0%/100% when total is small
    const alpha = 1;
    const photoHealth = total > 0 ? (healthy + alpha) / (total + 2 * alpha) : null;

    let healthLevel: HealthLevel = "Unknown";
    if (photoHealth !== null) {
      if (photoHealth >= 0.8) healthLevel = "Healthy";
      else if (photoHealth >= 0.6) healthLevel = "Moderate";
      else healthLevel = "Unhealthy";
    }

    // Keep original FastAPI label if provided
    const predictedClass = data?.status ?? data?.predictedClass ?? "Unknown";

    // Confidence: max over detections (if any)
    const confidence =
      Array.isArray(data?.detections) && data.detections.length > 0
        ? Math.max(...data.detections.map((d: any) => Number(d?.confidence ?? 0)))
        : 0;

    return NextResponse.json({
      predictedClass,
      confidence,
      status: healthLevel, // computed label for UI
      summary: { healthy, diseased, total },
      photoHealth,
      photoHealthPercent: photoHealth === null ? null : Math.round(photoHealth * 100),
      detections: data?.detections ?? null,
      fastApiMeta: {
        ok: true,
        url: FASTAPI_URL,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}
