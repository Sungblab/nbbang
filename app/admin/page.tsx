"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection, onSnapshot, orderBy, query, updateDoc, doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Room } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Users, DoorOpen, DoorClosed,
  Search, PowerOff, ExternalLink, TrendingUp
} from "lucide-react";

type Tab = "overview" | "rooms" | "users";

export default function AdminPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room)));
      setLoading(false);
    });
    return unsub;
  }, []);

  // 통계
  const stats = useMemo(() => {
    const now = Date.now();
    const active = rooms.filter((r) => r.is_active);
    const expired = rooms.filter((r) => !r.is_active);
    const uniqueUsers = new Set(rooms.map((r) => r.host_uid)).size;
    const today = rooms.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at.toMillis());
      const t = new Date();
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    });
    const expiringSoon = active.filter((r) => {
      if (!r.expires_at) return false;
      return r.expires_at.toMillis() - now < 1000 * 60 * 60 * 24 * 2;
    });
    return { total: rooms.length, active: active.length, expired: expired.length, uniqueUsers, today: today.length, expiringSoon: expiringSoon.length };
  }, [rooms]);

  // 필터링
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        !search ||
        r.room_name.toLowerCase().includes(search.toLowerCase()) ||
        r.host_name.toLowerCase().includes(search.toLowerCase()) ||
        r.bank.toLowerCase().includes(search.toLowerCase()) ||
        r.account.includes(search);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.is_active) ||
        (statusFilter === "inactive" && !r.is_active);
      return matchSearch && matchStatus;
    });
  }, [rooms, search, statusFilter]);

  // 사용자별 집계
  const userStats = useMemo(() => {
    const map = new Map<string, { name: string; total: number; active: number }>();
    for (const r of rooms) {
      const existing = map.get(r.host_uid);
      if (existing) {
        existing.total++;
        if (r.is_active) existing.active++;
      } else {
        map.set(r.host_uid, { name: r.host_name, total: 1, active: r.is_active ? 1 : 0 });
      }
    }
    return Array.from(map.entries())
      .map(([uid, v]) => ({ uid, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [rooms]);

  const handleDeactivate = async (roomId: string) => {
    setDeactivating(roomId);
    await updateDoc(doc(db, "rooms", roomId), { is_active: false });
    setDeactivating(null);
  };

  function getDaysLeft(room: Room): number {
    if (!room.expires_at) return 0;
    return Math.max(0, Math.ceil((room.expires_at.toMillis() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  function formatDate(room: Room): string {
    if (!room.created_at) return "-";
    return new Date(room.created_at.toMillis()).toLocaleDateString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 타이틀 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-sm text-gray-500 mt-0.5">전체 서비스 현황을 확인하고 관리하세요</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: "overview", label: "개요", icon: LayoutDashboard },
          { key: "rooms", label: "방 목록", icon: DoorOpen },
          { key: "users", label: "사용자", icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* 개요 탭 */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "전체 방", value: stats.total, icon: DoorOpen, color: "text-gray-900" },
              { label: "활성 방", value: stats.active, icon: DoorOpen, color: "text-green-600" },
              { label: "종료된 방", value: stats.expired, icon: DoorClosed, color: "text-gray-400" },
              { label: "가입 사용자", value: stats.uniqueUsers, icon: Users, color: "text-gray-900" },
              { label: "오늘 생성", value: stats.today, icon: TrendingUp, color: "text-gray-900" },
              { label: "곧 만료", value: stats.expiringSoon, icon: PowerOff, color: stats.expiringSoon > 0 ? "text-red-500" : "text-gray-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                <Icon size={16} className={`${color} mb-2`} />
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* 최근 방 (5개) */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">최근 생성된 방</h2>
              <button onClick={() => setTab("rooms")} className="text-xs text-gray-400 hover:text-gray-600">
                전체 보기 →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {rooms.slice(0, 5).map((room) => (
                <div key={room.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{room.room_name}</p>
                    <p className="text-xs text-gray-400">{room.host_name} · {formatDate(room)}</p>
                  </div>
                  <Badge variant={room.is_active ? "confirmed" : "outline"} className="text-xs">
                    {room.is_active ? "활성" : "종료"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* 사용자별 방 수 Top 5 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">방 생성 Top 사용자</h2>
              <button onClick={() => setTab("users")} className="text-xs text-gray-400 hover:text-gray-600">
                전체 보기 →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {userStats.slice(0, 5).map((u, i) => (
                <div key={u.uid} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{u.uid.slice(0, 16)}…</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{u.total}개</p>
                    <p className="text-xs text-gray-400">활성 {u.active}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 방 목록 탭 */}
      {tab === "rooms" && (
        <div className="space-y-3">
          {/* 필터 바 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="방 이름, 호스트, 계좌 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {([
                { key: "all", label: "전체" },
                { key: "active", label: "활성" },
                { key: "inactive", label: "종료" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">{filteredRooms.length}개 방</p>

          {/* 방 목록 테이블 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_80px_80px_100px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400">
              <span>방 이름</span>
              <span>호스트 / 계좌</span>
              <span>생성일</span>
              <span>만료</span>
              <span>상태</span>
              <span className="text-right">액션</span>
            </div>

            {filteredRooms.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">결과가 없어요</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredRooms.map((room) => {
                  const d = getDaysLeft(room);
                  return (
                    <div key={room.id} className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-[1fr_1fr_120px_80px_80px_100px] sm:items-center gap-2 sm:gap-3">
                      {/* 방 이름 */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{room.room_name}</p>
                        <p className="text-xs text-gray-400 font-mono sm:hidden">{room.host_name}</p>
                      </div>

                      {/* 호스트 / 계좌 */}
                      <div className="hidden sm:block">
                        <p className="text-sm text-gray-700">{room.host_name}</p>
                        <p className="text-xs text-gray-400">{room.bank} {room.account}</p>
                      </div>

                      {/* 생성일 */}
                      <p className="text-xs text-gray-400 hidden sm:block">{formatDate(room)}</p>

                      {/* 만료 */}
                      <div className="hidden sm:block">
                        {room.is_active ? (
                          <span className={`text-xs font-medium ${d <= 1 ? "text-red-500" : "text-gray-500"}`}>
                            {d === 0 ? "오늘" : `D-${d}`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>

                      {/* 상태 */}
                      <div className="flex gap-2 sm:block">
                        <Badge variant={room.is_active ? "confirmed" : "outline"} className="text-xs">
                          {room.is_active ? "활성" : "종료"}
                        </Badge>
                        {room.is_active && d <= 1 && (
                          <span className="sm:hidden text-xs text-red-500 font-medium">
                            {d === 0 ? "오늘 만료" : `D-${d}`}
                          </span>
                        )}
                      </div>

                      {/* 액션 */}
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 px-2 text-gray-400 hover:text-gray-700"
                        >
                          <a href={`/rooms/${room.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={13} />
                          </a>
                        </Button>
                        {room.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deactivating === room.id}
                            onClick={() => handleDeactivate(room.id)}
                            className="h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            title="방 비활성화"
                          >
                            <PowerOff size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 사용자 탭 */}
      {tab === "users" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">총 {userStats.length}명</p>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="hidden sm:grid grid-cols-[1fr_180px_80px_80px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400">
              <span>이름</span>
              <span>UID</span>
              <span className="text-center">방 생성</span>
              <span className="text-center">활성 방</span>
            </div>
            <div className="divide-y divide-gray-50">
              {userStats.map((u, i) => (
                <div key={u.uid} className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-[1fr_180px_80px_80px] sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-200 w-5 shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 font-mono pl-7 sm:pl-0 break-all">{u.uid}</p>
                  <p className="text-sm font-semibold text-gray-900 text-center pl-7 sm:pl-0">{u.total}</p>
                  <p className={`text-sm font-semibold text-center pl-7 sm:pl-0 ${u.active > 0 ? "text-green-600" : "text-gray-300"}`}>
                    {u.active}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
