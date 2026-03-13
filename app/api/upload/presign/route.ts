import { NextRequest, NextResponse } from "next/server";
import { getUploadPresignedUrl } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { roomId, participantId, contentType, ext } = await req.json();

    if (!roomId || !participantId || !contentType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const key = `proofs/${roomId}/${participantId}/${uuidv4()}.${ext ?? "jpg"}`;
    const presignedUrl = await getUploadPresignedUrl(key, contentType);

    return NextResponse.json({ presignedUrl, key });
  } catch (err) {
    console.error("presign error", err);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
