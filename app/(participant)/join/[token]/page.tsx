"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState, useRef } from "react";
import {
  collection, query, where, getDocs, onSnapshot,
  doc, updateDoc, addDoc, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Room, MenuItem, Participant, Assignment, PaymentProof } from "@/lib/types";
import { calculateAmounts } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Upload, Camera } from "lucide-react";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [room, setRoom] = useState<Room | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 토큰으로 방 조회
  useEffect(() => {
    const findRoom = async () => {
      const q = query(collection(db, "rooms"), where("share_token", "==", token));
      const snap = await getDocs(q);
      if (snap.empty) { setNotFound(true); setLoading(false); return; }
      const roomData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Room;
      setRoom(roomData);
      setLoading(false);

      // 서브컬렉션 실시간 구독
      const unsubs = [
        onSnapshot(collection(db, "rooms", roomData.id, "menu_items"), (s) => {
          setMenuItems(s.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem)));
        }),
        onSnapshot(collection(db, "rooms", roomData.id, "participants"), (s) => {
          setParticipants(s.docs.map((d) => ({ id: d.id, ...d.data() } as Participant)));
        }),
        onSnapshot(collection(db, "rooms", roomData.id, "assignments"), (s) => {
          setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment)));
        }),
      ];
      return () => unsubs.forEach((u) => u());
    };
    findRoom();
  }, [token]);

  // 선택된 참여자의 인증 상태 구독
  useEffect(() => {
    if (!room || !selectedParticipant) return;
    const q = query(
      collection(db, "rooms", room.id, "payment_proofs"),
      where("participant_id", "==", selectedParticipant.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      setProof(snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as PaymentProof));
    });
    return unsub;
  }, [room, selectedParticipant]);

  const handleSelectParticipant = async (p: Participant) => {
    if (p.claimed && selectedParticipant?.id !== p.id) {
      if (!confirm(`${p.name} 님은 이미 선택된 상태입니다. 그래도 선택하시겠어요?`)) return;
    }
    if (selectedParticipant) {
      await updateDoc(doc(db, "rooms", room!.id, "participants", selectedParticipant.id), {
        claimed: false,
      });
    }
    await updateDoc(doc(db, "rooms", room!.id, "participants", p.id), { claimed: true });
    setSelectedParticipant(p);
  };

  const handleCopyAccount = async () => {
    await navigator.clipboard.writeText(room!.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room || !selectedParticipant) return;
    setUploadError("");

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      // HEIC 변환
      let uploadFile = file;
      if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        uploadFile = new File(
          [converted as Blob],
          file.name.replace(/\.heic$/i, ".jpg"),
          { type: "image/jpeg" }
        );
      }

      // presigned URL 요청
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          participantId: selectedParticipant.id,
          contentType: uploadFile.type,
          ext: uploadFile.name.split(".").pop(),
        }),
      });
      const { presignedUrl, key } = await res.json();

      // R2에 직접 업로드
      await fetch(presignedUrl, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": uploadFile.type },
      });

      // Firestore에 기록
      if (proof) {
        await updateDoc(doc(db, "rooms", room.id, "payment_proofs", proof.id), {
          image_url: key,
          status: "pending",
          submitted_at: Timestamp.now(),
          reviewed_at: null,
        });
      } else {
        await addDoc(collection(db, "rooms", room.id, "payment_proofs"), {
          participant_id: selectedParticipant.id,
          participant_name: selectedParticipant.name,
          image_url: key,
          status: "pending",
          submitted_at: Timestamp.now(),
        });
      }
    } catch {
      setUploadError("업로드에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (notFound || !room || !room.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {notFound ? "정산 방을 찾을 수 없어요" : "만료된 정산방이에요"}
          </h1>
          <p className="text-gray-500 text-sm">링크를 다시 확인해주세요</p>
        </div>
      </div>
    );
  }

  const amounts = calculateAmounts(menuItems, assignments, participants.map((p) => p.id));
  const myAmount = selectedParticipant ? (amounts.get(selectedParticipant.id) ?? 0) : null;

  const proofStatusLabel: Record<string, string> = {
    pending: "확인 대기중",
    confirmed: "입금 확인됨",
    rejected: "재업로드 요청",
  };
  const proofStatusVariant: Record<string, "pending" | "confirmed" | "rejected"> = {
    pending: "pending",
    confirmed: "confirmed",
    rejected: "rejected",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 text-center sticky top-0 z-10">
        <h1 className="font-bold text-gray-900">엔빵하기</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 방 정보 */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{room.room_name}</h2>
          <p className="text-sm text-gray-500 mt-1">정산자: {room.host_name}</p>
        </div>

        {/* 참여자 선택 */}
        {!selectedParticipant ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">본인을 선택해주세요</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">방장이 아직 인원을 추가하지 않았어요</p>
              ) : (
                <div className="grid gap-2">
                  {participants.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectParticipant(p)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                        p.claimed
                          ? "border-gray-200 bg-gray-50 text-gray-400"
                          : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-sm font-semibold">
                        {(amounts.get(p.id) ?? 0).toLocaleString()}원
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 내 금액 카드 */}
            <Card className="bg-gray-900 border-0 text-white">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">
                  {selectedParticipant.name} 님이 낼 금액
                </p>
                <p className="text-4xl font-bold mb-4">
                  {myAmount?.toLocaleString()}원
                </p>

                {/* 계좌 정보 */}
                <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-gray-400 text-xs">{room.bank}</p>
                    <p className="font-mono font-semibold">{room.account}</p>
                    <p className="text-gray-400 text-xs">{room.host_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAccount}
                    className="text-white hover:bg-gray-700 gap-1.5"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "복사됨" : "복사"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 내역 */}
            {menuItems.filter((m) => assignments.some((a) => a.participant_id === selectedParticipant.id && a.menu_item_id === m.id)).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">내 주문 내역</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {menuItems
                    .filter((m) => assignments.some((a) => a.participant_id === selectedParticipant.id && a.menu_item_id === m.id))
                    .map((m) => {
                      const isShared = m.is_shared;
                      const sharedCount = isShared
                        ? assignments.filter((a) => a.menu_item_id === m.id).length
                        : 1;
                      const myShare = isShared
                        ? Math.floor((m.price * m.qty) / sharedCount)
                        : m.price * m.qty;
                      return (
                        <div key={m.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {m.name}
                            {isShared && <span className="text-gray-400 ml-1">(공유 ÷{sharedCount})</span>}
                          </span>
                          <span className="font-medium">{myShare.toLocaleString()}원</span>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}

            {/* 입금 인증 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">입금 인증</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proof ? (
                  <div className="text-center space-y-2">
                    <Badge variant={proofStatusVariant[proof.status] ?? "pending"} className="text-sm px-3 py-1">
                      {proofStatusLabel[proof.status]}
                    </Badge>
                    {proof.status === "rejected" && (
                      <div className="bg-red-50 rounded-lg p-3 text-sm text-red-600">
                        <p className="font-medium mb-1">반려 사유</p>
                        <p>{proof.rejected_reason || "인증 사진을 다시 업로드해주세요."}</p>
                      </div>
                    )}
                    {proof.status !== "confirmed" && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload size={16} />
                        {uploading ? "업로드 중..." : "다시 업로드"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500">
                      입금 후 송금 완료 캡처를 업로드해주세요
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera size={16} />
                      {uploading ? "업로드 중..." : "인증 사진 업로드"}
                    </Button>
                  </div>
                )}
                {uploadError && <p className="text-sm text-red-500 text-center">{uploadError}</p>}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </CardContent>
            </Card>

            <button
              onClick={() => setSelectedParticipant(null)}
              className="text-sm text-gray-400 text-center w-full"
            >
              다른 사람으로 변경
            </button>
          </>
        )}
      </main>
    </div>
  );
}
