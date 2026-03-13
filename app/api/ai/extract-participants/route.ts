import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-flash-lite-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { imageBase64, mimeType } = await req.json();

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "imageBase64 and mimeType are required" }, { status: 400 });
  }

  const prompt = `이 이미지는 카카오톡, 라인, 문자 등 메시지 앱의 단체 채팅방 또는 대화 스크린샷입니다.

이 채팅방에 참여 중인 사람들의 이름(닉네임) 목록을 추출해주세요.

규칙:
1. 메시지를 보낸 사람 이름만 추출 (채팅방 제목, 날짜/시간, 시스템 메시지 제외)
2. 중복 없이 유니크한 이름만
3. "나" 또는 자기 자신은 제외 (오른쪽 정렬된 말풍선의 발신자)
4. 실제 이름이나 닉네임만 추출 (숫자만 있는 것, 이모지만 있는 것 제외)
5. 최대 20명까지

반드시 아래 JSON 형식만 반환하세요 (다른 텍스트 없이):
{
  "names": ["이름1", "이름2", "이름3"]
}`;

  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: "AI 분석에 실패했습니다." }, { status: 502 });
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    return NextResponse.json({ error: "AI 응답을 받지 못했습니다." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "응답 파싱 실패", raw }, { status: 502 });
  }
}
