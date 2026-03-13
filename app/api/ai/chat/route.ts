import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-flash-lite-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { message, participants, menuItems } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const systemPrompt = `당신은 한국 더치페이 정산 앱 "엔빵하기"의 AI 도우미입니다.
사용자가 자연어로 음식 주문 내역을 설명하면, 이를 구조화된 JSON으로 파싱하세요.

현재 방의 기존 데이터:
- 등록된 참가자: ${participants?.length ? participants.map((p: {name: string}) => p.name).join(", ") : "없음"}
- 등록된 메뉴: ${menuItems?.length ? menuItems.map((m: {name: string; price: number}) => `${m.name}(${m.price}원)`).join(", ") : "없음"}

파싱 규칙:
1. "이름: 메뉴 금액" 형식이면 해당 참가자가 그 메뉴를 개인 주문한 것
2. "???" 또는 "????" 는 이름 미상 → 메뉴는 추가하되 참가자 배정 없음
3. "나눠먹었어", "나눠먹었고", "공유", "같이 먹었어", "시켜서 나눠" 등의 표현이 있으면 is_shared: true (공유 메뉴)
4. 개인 주문은 is_shared: false
5. 이미 등록된 참가자/메뉴와 동일한 이름이면 새로 추가하지 않음 (add_participants, add_menu_items 목록에서 제외)
6. 가격은 숫자만 (원 단위)
7. "각" 또는 "1개" 등은 수량(qty)으로 반영

반드시 아래 JSON 형식만 반환하세요 (다른 텍스트 없이):
{
  "message": "파싱 결과를 친근하게 한국어로 요약한 메시지. 추가될 항목들을 구체적으로 언급해주세요.",
  "actions": {
    "add_participants": ["이름1", "이름2"],
    "add_menu_items": [
      {"name": "메뉴명", "price": 단가숫자, "qty": 수량숫자, "is_shared": true/false}
    ],
    "add_assignments": [
      {"participant_name": "참가자명", "menu_item_name": "메뉴명"}
    ]
  }
}`;

  const body = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `사용자 입력: ${message}` },
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
