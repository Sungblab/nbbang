"use client";

import { use, useEffect, useState } from "react";
import {
  doc, collection, onSnapshot, updateDoc, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { Room, Participant, PaymentProof } from "@/lib/types";
import { ProofLightbox } from "@/components/host/ProofLightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ZoomIn } from "lucide-react";
import Link from "next/link";

export default function ProofPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxKey, setLightboxKey] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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
      onSnapshot(collection(db, "rooms", roomId, "participants"), (snap) => {
        setParticipants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Participant)));
      })
    );

    unsubs.push(
      onSnapshot(collection(db, "rooms", roomId, "payment_proofs"), (snap) => {
        setProofs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentProof)));
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [roomId, user, router]);

  const handleConfirm = async (proofId: string) => {
    await updateDoc(doc(db, "rooms", roomId, "payment_proofs", proofId), {
      status: "confirmed",
      reviewed_at: Timestamp.now(),
    });
  };

  const handleReject = async (proofId: string) => {
    await updateDoc(doc(db, "rooms", roomId, "payment_proofs", proofId), {
      status: "rejected",
      rejected_reason: rejectReason || "인증 사진을 다시 업로드해주세요.",
      reviewed_at: Timestamp.now(),
    });
    setRejecting(null);
    setRejectReason("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  const confirmedCount = proofs.filter((p) => p.status === "confirmed").length;
  const totalCount = participants.length;
  const allConfirmed = totalCount > 0 && confirmedCount === totalCount;

  const statusLabel: Record<string, string> = {
    pending: "확인 대기",
    confirmed: "확인됨",
    rejected: "반려",
  };
  const statusVariant: Record<string, "pending" | "confirmed" | "rejected" | "outline"> = {
    pending: "pending",
    confirmed: "confirmed",
    rejected: "rejected",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/rooms/${roomId}`}><ArrowLeft size={18} /></Link>
        </Button>
        <h1 className="text-xl font-bold text-gray-900">입금 인증 확인</h1>
      </div>

      {/* 진행률 */}
      {allConfirmed ? (
        <div className="bg-gray-900 rounded-xl p-5 mb-4 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-white font-bold text-lg">정산 완료!</p>
          <p className="text-gray-400 text-sm mt-1">모든 참여자({totalCount}명)의 입금이 확인됐어요</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">확인 완료</span>
            <span className="text-sm font-bold text-gray-900">{confirmedCount}/{totalCount}명</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all"
              style={{ width: totalCount > 0 ? `${(confirmedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* 참여자 목록 */}
      <div className="space-y-3">
        {participants.map((p) => {
          const proof = proofs.find((pr) => pr.participant_id === p.id);
          const isRejecting = rejecting === p.id;

          return (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{p.name}</span>
                  <Badge variant={proof ? (statusVariant[proof.status] ?? "outline") : "outline"}>
                    {proof ? statusLabel[proof.status] : "미업로드"}
                  </Badge>
                </div>

                {proof && (
                  <>
                    {/* 인증 사진 썸네일 */}
                    <button
                      onClick={() => setLightboxKey(proof.image_url)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <ZoomIn size={14} />
                      인증 사진 보기
                    </button>

                    {/* 액션 버튼 */}
                    {proof.status !== "confirmed" && !isRejecting && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          className="flex-1"
                          onClick={() => handleConfirm(proof.id)}
                        >
                          확인 완료
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => setRejecting(p.id)}
                        >
                          반려
                        </Button>
                      </div>
                    )}

                    {/* 반려 사유 입력 */}
                    {isRejecting && (
                      <div className="space-y-2">
                        <input
                          className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                          placeholder="반려 사유 (선택)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(proof.id)}
                          >
                            반려 확인
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setRejecting(null); setRejectReason(""); }}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}

                    {proof.status === "confirmed" && (
                      <p className="text-sm text-green-600 font-medium">✓ 입금 확인 완료</p>
                    )}
                  </>
                )}

                {!proof && (
                  <p className="text-sm text-gray-400">아직 인증 사진을 올리지 않았어요</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProofLightbox imageKey={lightboxKey} onClose={() => setLightboxKey(null)} />
    </div>
  );
}
