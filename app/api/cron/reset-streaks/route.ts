import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const url = new URL(req.url);
  const token = url.searchParams.get("key");
  const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return token === secret || header === secret;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const today = isoToday();
    const yesterday = isoYesterday();

    const snap = await db.collection("userStats").where("currentStreak", ">", 0).get();

    let updated = 0;
    let checked = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snap.docs) {
      checked += 1;
      const data = doc.data() as { lastActionDate?: string | null; currentStreak?: number };
      const lastActionDate = data.lastActionDate ?? null;

      const shouldReset =
        !lastActionDate || (lastActionDate !== today && lastActionDate !== yesterday);

      if (!shouldReset) continue;

      batch.update(doc.ref, {
        currentStreak: 0,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchCount += 1;
      updated += 1;

      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      ok: true,
      checked,
      updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}
