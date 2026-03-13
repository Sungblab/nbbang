"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const BANKS = [
  "카카오뱅크", "토스뱅크", "케이뱅크",
  "국민은행", "신한은행", "하나은행", "우리은행",
  "농협은행", "기업은행", "SC제일은행", "씨티은행",
  "부산은행", "경남은행", "광주은행", "전북은행", "제주은행",
];

export default function NewRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    room_name: "",
    host_name: user?.displayName ?? "",
    bank: "",
    account: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_name || !form.bank || !form.account) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);
      const ref = await addDoc(collection(db, "rooms"), {
        host_uid: user!.uid,
        host_name: form.host_name || user!.displayName || "방장",
        room_name: form.room_name,
        bank: form.bank,
        account: form.account,
        share_token: uuidv4(),
        is_active: true,
        expires_at: expiresAt,
        created_at: now,
      });
      router.push(`/rooms/${ref.id}`);
    } catch {
      setError("방 생성에 실패했어요. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft size={18} /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">새 정산 방 만들기</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-gray-700">정산 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모임명 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="예) 6월 회식, 제주 여행"
                value={form.room_name}
                onChange={(e) => setForm((f) => ({ ...f, room_name: e.target.value }))}
                maxLength={40}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정산자 이름
              </label>
              <Input
                placeholder="입금받을 사람 이름"
                value={form.host_name}
                onChange={(e) => setForm((f) => ({ ...f, host_name: e.target.value }))}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행 <span className="text-red-500">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.bank}
                onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
              >
                <option value="">은행 선택</option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="- 없이 숫자만"
                value={form.account}
                onChange={(e) => setForm((f) => ({ ...f, account: e.target.value.replace(/[^0-9]/g, "") }))}
                inputMode="numeric"
                maxLength={20}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "만드는 중..." : "방 만들기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
