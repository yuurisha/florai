import { NextRequest, NextResponse } from "next/server";

/**
 * This API route acts as a proxy for the AI prediction API.
 * It allows the frontend to call the AI model without CORS issues.
 * 
 * During development: calls localhost:8001
 * During production: calls the deployed Render API
 */

const AI_MODEL_API = process.env.NEXT_PUBLIC_AI_MODEL_API || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📡 Calling AI Model API at:", AI_MODEL_API);
    console.log("📊 Request body:", JSON.stringify(body, null, 2));

    // Call the AI model API
    const response = await fetch(`${AI_MODEL_API}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("📬 AI API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `AI API returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ AI prediction successful:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ AI predict proxy error:", error);
    return NextResponse.json(
      { 
        error: "Failed to call AI prediction API",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
