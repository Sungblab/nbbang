import { NextRequest, NextResponse } from "next/server";
import { getViewPresignedUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  if (!key.startsWith("proofs/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const url = await getViewPresignedUrl(key);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Failed to get view URL" }, { status: 500 });
  }
}
