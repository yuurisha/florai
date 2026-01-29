export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Missing or invalid JSON body" }), {
      status: 400,
    });
  }

  const riskUrl = "http://127.0.0.1:8000/predict";
  const spreadUrl = "http://127.0.0.1:8000/predictSpread";

  try {
    const [riskRes, spreadRes] = await Promise.all([
      fetch(riskUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      fetch(spreadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ]);

    const riskData = await riskRes.json();
    const spreadData = await spreadRes.json();

    const combined = {
      ...riskData,
      ...spreadData,
    };

    console.log("🧪 Combined result to frontend:", combined);
    return Response.json(combined);
  } catch (error) {
    console.error("❌ Prediction API error:", error);
    return new Response(JSON.stringify({ error: "Prediction failed" }), {
      status: 500,
    });
  }
}
