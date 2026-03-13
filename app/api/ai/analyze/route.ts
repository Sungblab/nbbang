import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-flash-lite-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `당신은 더치페이 정산 앱 "엔빵하기"의 AI 도우미입니다.
사용자가 제공한 영수증 사진 또는 메뉴 설명을 분석하여 메뉴 항목을 추출해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "items": [
    {
      "name": "메뉴명",
      "price": 단가(숫자, 원 단위),
      "qty": 수량(숫자),
      "is_shared": true 또는 false
    }
  ],
  "message": "분석 결과에 대한 한 줄 요약"
}

규칙:
- price는 단가(1개 가격)이며 숫자만 입력 (콤마, 원 기호 없음)
- qty는 주문 수량
- is_shared: 여러 명이 나눠 먹는 공유 메뉴면 true, 개인 메뉴면 false
- 금액을 알 수 없으면 price를 0으로 설정
- 영수증에서 할인, 봉사료, 세금 등은 별도 항목으로 포함
- 모든 응답은 한국어로 작성`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const text = formData.get("text") as string | null;
  const image = formData.get("image") as File | null;

  if (!text && !image) {
    return NextResponse.json({ error: "text 또는 image가 필요합니다." }, { status: 400 });
  }

  // Build Gemini parts
  const parts: object[] = [{ text: SYSTEM_PROMPT }];

  if (image) {
    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    parts.push({
      inlineData: {
        mimeType: image.type || "image/jpeg",
        data: base64,
      },
    });
    parts.push({
      text: text
        ? `위 이미지를 분석하고 다음 내용도 참고해주세요: ${text}`
        : "위 영수증/메뉴판 이미지에서 모든 메뉴 항목과 가격을 추출해주세요.",
    });
  } else {
    parts.push({
      text: `다음 메뉴 설명을 파싱해주세요: ${text}`,
    });
  }

  const body = {
    contents: [{ parts }],
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
    return NextResponse.json({ error: "AI 응답을 파싱할 수 없습니다." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "JSON 파싱 실패", raw }, { status: 502 });
  }
}
