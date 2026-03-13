"use client";

import { use, useEffect, useState } from "react";
import { doc, collection, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { Room, MenuItem, Participant, Assignment } from "@/lib/types";
import { calculateAmounts } from "@/lib/calc";
import { MenuSection } from "@/components/host/MenuSection";
import { ParticipantSection } from "@/components/host/ParticipantSection";
import { ShareSection } from "@/components/host/ShareSection";
import { AiChatBot } from "@/components/host/AiChatBot";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, PowerOff } from "lucide-react";
import Link from "next/link";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingRoom, setClosingRoom] = useState(false);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(doc(db, "rooms", roomId), (snap) => {
        if (!snap.exists()) { router.replace("/dashboard"); return; }
        const data = { id: snap.id, ...snap.data() } as Room;
        if (data.host_uid !== user?.uid) { router.replace("/dashboard"); return; }
        setRoom(data);
        setLoading(false);
      })
    );

    unsubs.push(
      onSnapshot(collection(db, "rooms", roomId, "menu_items"), (snap) => {
        setMenuItems(snap.docs.map((d) => ({ id: d.id, room_id: roomId, ...d.data() } as MenuItem)));
      })
    );

    unsubs.push(
      onSnapshot(collection(db, "rooms", roomId, "participants"), (snap) => {
        setParticipants(snap.docs.map((d) => ({ id: d.id, room_id: roomId, ...d.data() } as Participant)));
      })
    );

    unsubs.push(
      onSnapshot(collection(db, "rooms", roomId, "assignments"), (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [roomId, user, router]);

  const handleCloseRoom = async () => {
    if (!confirm("방을 종료하시겠어요?\n참여자들이 더 이상 링크로 접속할 수 없게 됩니다.")) return;
    setClosingRoom(true);
    await updateDoc(doc(db, "rooms", roomId), { is_active: false });
    setClosingRoom(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!room) return null;

  // 정산 요약 계산
  const totalAmount = menuItems.reduce((sum, m) => sum + m.price * m.qty, 0);
  const amounts = calculateAmounts(menuItems, assignments, participants.map((p) => p.id));
  const assignedCount = participants.filter((p) => (amounts.get(p.id) ?? 0) > 0).length;

  // 만료일 D-day
  const now = Date.now();
  const expiresMs = room.expires_at.toMillis();
  const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft size={18} /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{room.room_name}</h1>
              {!room.is_active && (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">종료됨</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{room.bank} {room.account}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href={`/rooms/${roomId}/proof`}>
            <ClipboardCheck size={14} />
            인증 확인
          </Link>
        </Button>
      </div>

      {/* 정산 요약 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">총 금액</p>
              <p className="text-base font-bold text-gray-900">
                {totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : "—"}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">참가자</p>
              <p className="text-base font-bold text-gray-900">
                {participants.length > 0
                  ? `${assignedCount}/${participants.length}명 배정`
                  : "0명"}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">만료</p>
              <p className={`text-base font-bold ${daysLeft <= 1 ? "text-red-500" : "text-gray-900"}`}>
                {room.is_active ? (daysLeft === 0 ? "오늘" : `D-${daysLeft}`) : "종료"}
              </p>
            </div>
          </div>

          {room.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseRoom}
              disabled={closingRoom}
              className="gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <PowerOff size={13} />
              <span className="hidden sm:inline">방 종료</span>
            </Button>
          )}
        </div>
      </div>

      <ShareSection shareToken={room.share_token} roomName={room.room_name} />
      <MenuSection roomId={roomId} menuItems={menuItems} />
      <ParticipantSection
        roomId={roomId}
        menuItems={menuItems}
        participants={participants}
        assignments={assignments}
      />

      <AiChatBot
        roomId={roomId}
        participants={participants}
        menuItems={menuItems}
        assignments={assignments}
      />
    </div>
  );
}
