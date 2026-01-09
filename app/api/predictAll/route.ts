// export async function POST(req: Request) {
//   let body;
//   try {
//     body = await req.json();
//   } catch (err) {
//     return new Response(JSON.stringify({ error: "Missing or invalid JSON body" }), {
//       status: 400,
//     });
//   }

//   const riskUrl = "http://127.0.0.1:8000/predict";
//   const spreadUrl = "http://127.0.0.1:8000/predictSpread";

//   try {
//     const [riskRes, spreadRes] = await Promise.all([
//       fetch(riskUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...body, userId: body.userId }),
//       }),
//       fetch(spreadUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...body, userId: body.userId }),
//       }),
//     ]);
 
//     const riskData = await riskRes.json();
//     const spreadData = await spreadRes.json();

//     const combined = {
//       ...riskData,
//       ...spreadData,
//     };

//     console.log("🧪 Combined result to frontend:", combined);
//     return Response.json(combined);
//   } catch (error) {
//     console.error("❌ Prediction API error:", error);
//     return new Response(JSON.stringify({ error: "Prediction failed" }), {
//       status: 500,
//     });
//   }
// }

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const base = process.env.MODEL_SERVER_URL;
    if (!base) {
      return new Response(JSON.stringify({ error: "MODEL_SERVER_URL not set" }), {
        status: 500,
      });
    }

    const fastApiUrl = `${base.replace(/\/$/, "")}/predictAll`;

    const res = await fetch(fastApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("FastAPI error:", text);
      return new Response(JSON.stringify({ error: "Prediction failed", details: text }), {
        status: res.status,
      });
    }

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ predictAll route crashed:", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}

