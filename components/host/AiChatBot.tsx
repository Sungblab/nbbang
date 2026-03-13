"use client";

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MenuItem, Participant, Assignment } from "@/lib/types";
import { Sparkles, X, Send, Loader2, ChevronDown } from "lucide-react";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  applied?: boolean;
  actions?: AiActions;
}

interface AiMenuItem {
  name: string;
  price: number;
  qty: number;
  is_shared: boolean;
}

interface AiAssignment {
  participant_name: string;
  menu_item_name: string;
}

interface AiActions {
  add_participants: string[];
  add_menu_items: AiMenuItem[];
  add_assignments: AiAssignment[];
}

interface Props {
  roomId: string;
  participants: Participant[];
  menuItems: MenuItem[];
  assignments: Assignment[];
}

const INTRO = "안녕하세요! 주문 내역을 자유롭게 말씀해 주세요.\n\n예) 홍길동: 짜장면 7000원, 홍길동1: 짬뽕 9000원, 탕수육 30000원 나눠먹었어";

export function AiChatBot({ roomId, participants, menuItems, assignments }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: INTRO },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, participants, menuItems }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "AI 오류");

      const hasActions =
        data.actions?.add_participants?.length ||
        data.actions?.add_menu_items?.length ||
        data.actions?.add_assignments?.length;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.message ?? "분석 완료!",
          actions: hasActions ? data.actions : undefined,
          applied: false,
        },
      ]);
    } catch (e: unknown) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: e instanceof Error ? e.message : "오류가 발생했어요. 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (msgIdx: number, actions: AiActions) => {
    setApplying(msgIdx);
    try {
      const participantIdMap = new Map<string, string>();
      const menuItemIdMap = new Map<string, string>();

      // 기존 참가자 ID 매핑
      for (const p of participants) participantIdMap.set(p.name, p.id);
      // 기존 메뉴 ID 매핑
      for (const m of menuItems) menuItemIdMap.set(m.name, m.id);

      // 참가자 추가
      for (const name of actions.add_participants ?? []) {
        if (!participantIdMap.has(name)) {
          const ref = await addDoc(collection(db, "rooms", roomId, "participants"), {
            name,
            claimed: false,
          });
          participantIdMap.set(name, ref.id);
        }
      }

      // 메뉴 추가
      for (const item of actions.add_menu_items ?? []) {
        if (!menuItemIdMap.has(item.name)) {
          const ref = await addDoc(collection(db, "rooms", roomId, "menu_items"), {
            name: item.name,
            price: item.price,
            qty: item.qty,
            is_shared: item.is_shared,
          });
          menuItemIdMap.set(item.name, ref.id);
        }
      }

      // 배정 추가 (중복 방지)
      for (const assign of actions.add_assignments ?? []) {
        const participantId = participantIdMap.get(assign.participant_name);
        const menuItemId = menuItemIdMap.get(assign.menu_item_name);
        if (!participantId || !menuItemId) continue;

        // 이미 배정됐는지 확인
        const existing = assignments.find(
          (a) => a.participant_id === participantId && a.menu_item_id === menuItemId
        );
        if (!existing) {
          // Firestore에도 없는지 확인
          const q = query(
            collection(db, "rooms", roomId, "assignments"),
            where("participant_id", "==", participantId),
            where("menu_item_id", "==", menuItemId)
          );
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, "rooms", roomId, "assignments"), {
              participant_id: participantId,
              menu_item_id: menuItemId,
            });
          }
        }
      }

      setMessages((prev) =>
        prev.map((m, i) => (i === msgIdx ? { ...m, applied: true } : m))
      );
    } catch (e) {
      console.error("apply error", e);
    } finally {
      setApplying(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50">
      {/* 채팅 패널 */}
      {open && (
        <div className="absolute bottom-16 right-0 w-[min(340px,calc(100vw-2rem))] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-900">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-white" />
              <span className="text-sm font-semibold text-white">AI 정산 도우미</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : ""}`}>
                  {/* 말풍선 */}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* 액션 적용 버튼 */}
                  {msg.role === "ai" && msg.actions && (
                    <div className="mt-2">
                      {msg.applied ? (
                        <span className="text-xs text-green-600 font-medium pl-1">✓ 적용 완료</span>
                      ) : (
                        <button
                          onClick={() => handleApply(idx, msg.actions!)}
                          disabled={applying === idx}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          {applying === idx ? (
                            <><Loader2 size={11} className="animate-spin" /> 적용 중...</>
                          ) : (
                            <>
                              <Sparkles size={11} />
                              정산방에 적용하기
                              {[
                                ...(msg.actions.add_participants?.length ? [`참가자 ${msg.actions.add_participants.length}명`] : []),
                                ...(msg.actions.add_menu_items?.length ? [`메뉴 ${msg.actions.add_menu_items.length}개`] : []),
                              ].join(" · ")}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 로딩 */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-100">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-gray-900 transition-colors">
              <textarea
                ref={textareaRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={"메뉴와 주문자를 입력해주세요\nShift+Enter로 줄바꿈"}
                className="flex-1 text-sm bg-transparent resize-none focus:outline-none placeholder:text-gray-300 leading-relaxed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-30"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? "bg-gray-200 text-gray-700 rotate-0" : "bg-gray-900 text-white hover:scale-105"
        }`}
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>
    </div>
  );
}
