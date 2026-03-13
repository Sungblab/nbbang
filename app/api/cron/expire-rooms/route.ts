import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  const now = Timestamp.now();
  const snap = await adminDb
    .collection("rooms")
    .where("is_active", "==", true)
    .where("expires_at", "<", now)
    .get();

  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { is_active: false }));
  await batch.commit();

  return NextResponse.json({ expired: snap.size });
}
