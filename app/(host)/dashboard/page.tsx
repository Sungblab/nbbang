"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Room } from "@/lib/types";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";

function getDaysLeft(room: Room): number {
  if (!room.expires_at) return 0;
  const ms = room.expires_at.toMillis() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rooms"),
      where("host_uid", "==", user.uid),
      orderBy("created_at", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 정산 목록</h1>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/rooms/new">
            <Plus size={16} />
            새 방 만들기
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🍽️</p>
          <p className="text-gray-500 mb-4">아직 만든 정산 방이 없어요</p>
          <Button asChild>
            <Link href="/rooms/new">첫 번째 방 만들기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{room.room_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {room.bank} {room.account}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.is_active ? (
                      <>
                        {(() => {
                          const d = getDaysLeft(room);
                          return (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              d <= 1 ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"
                            }`}>
                              {d === 0 ? "오늘 만료" : `D-${d}`}
                            </span>
                          );
                        })()}
                        <Badge variant="confirmed">진행중</Badge>
                      </>
                    ) : (
                      <Badge variant="outline">만료</Badge>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
