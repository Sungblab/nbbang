"use client";

import { useState, useRef } from "react";
import {
  collection, addDoc, deleteDoc, doc, writeBatch, getDocs, query, where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MenuItem, Participant, Assignment } from "@/lib/types";
import { calculateAmounts } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Check, ScanText, Loader2, X } from "lucide-react";

interface Props {
  roomId: string;
  menuItems: MenuItem[];
  participants: Participant[];
  assignments: Assignment[];
}

export function ParticipantSection({ roomId, menuItems, participants, assignments }: Props) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // 사진으로 불러오기
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [extractedNames, setExtractedNames] = useState<string[] | null>(null);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    await addDoc(collection(db, "rooms", roomId, "participants"), {
      name: newName.trim(),
      claimed: false,
    });
    setNewName("");
    setAdding(false);
  };

  const handleDeleteParticipant = async (participantId: string) => {
    const batch = writeBatch(db);
    const assignSnap = await getDocs(
      query(collection(db, "rooms", roomId, "assignments"), where("participant_id", "==", participantId))
    );
    assignSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "rooms", roomId, "participants", participantId));
    await batch.commit();
    setConfirmDelete(null);
  };

  const toggleAssignment = async (participantId: string, menuItemId: string) => {
    const existing = assignments.find(
      (a) => a.participant_id === participantId && a.menu_item_id === menuItemId
    );
    if (existing) {
      await deleteDoc(doc(db, "rooms", roomId, "assignments", existing.id));
    } else {
      await addDoc(collection(db, "rooms", roomId, "assignments"), {
        participant_id: participantId,
        menu_item_id: menuItemId,
      });
    }
  };

  // 사진 → Gemini 이름 추출
  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    setScanError("");
    setExtractedNames(null);
    setScanning(true);

    try {
      // base64 변환
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // data:image/jpeg;base64,XXXX → XXXX
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/ai/extract-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "분석 실패");

      const names: string[] = (data.names ?? []).filter(
        (n: string) => !participants.some((p) => p.name === n)
      );

      if (names.length === 0) {
        setScanError("새로운 참여자를 찾지 못했어요. 채팅방 스크린샷인지 확인해주세요.");
      } else {
        setExtractedNames(names);
        setSelectedNames(new Set(names)); // 기본 전체 선택
      }
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "분석 중 오류가 발생했어요.");
    } finally {
      setScanning(false);
    }
  };

  const toggleName = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleBulkAdd = async () => {
    if (selectedNames.size === 0) return;
    setBulkAdding(true);
    for (const name of selectedNames) {
      await addDoc(collection(db, "rooms", roomId, "participants"), {
        name,
        claimed: false,
      });
    }
    setExtractedNames(null);
    setSelectedNames(new Set());
    setBulkAdding(false);
  };

  const amounts = calculateAmounts(
    menuItems,
    assignments,
    participants.map((p) => p.id)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">인원 배정</CardTitle>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40"
          title="메시지방 사진으로 불러오기"
        >
          {scanning ? <Loader2 size={13} className="animate-spin" /> : <ScanText size={13} />}
          {scanning ? "분석 중..." : "사진으로 불러오기"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleScanImage}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 스캔 결과 패널 */}
        {extractedNames && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">
                {extractedNames.length}명 발견 — 추가할 인원을 선택하세요
              </p>
              <button
                onClick={() => { setExtractedNames(null); setSelectedNames(new Set()); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {extractedNames.map((name) => {
                const selected = selectedNames.has(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleName(name)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selected
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {selected && <Check size={10} />}
                    {name}
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              className="w-full gap-1.5"
              disabled={selectedNames.size === 0 || bulkAdding}
              onClick={handleBulkAdd}
            >
              {bulkAdding ? (
                <><Loader2 size={13} className="animate-spin" /> 추가 중...</>
              ) : (
                <><Plus size={13} /> {selectedNames.size}명 추가하기</>
              )}
            </Button>
          </div>
        )}

        {scanError && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{scanError}</p>
        )}

        {/* 참여자 추가 폼 */}
        <form onSubmit={handleAddParticipant} className="flex gap-2">
          <Input
            placeholder="이름 직접 입력"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={adding} className="gap-1">
            <Plus size={14} />
            추가
          </Button>
        </form>

        {participants.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">참여자를 추가해주세요</p>
        ) : (
          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {(amounts.get(p.id) ?? 0).toLocaleString()}원
                    </span>
                    {confirmDelete === p.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-600 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs font-medium text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 메뉴 배정 체크박스 */}
                {menuItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {menuItems.map((item) => {
                      const isAssigned = assignments.some(
                        (a) => a.participant_id === p.id && a.menu_item_id === item.id
                      );
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleAssignment(p.id, item.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            isAssigned
                              ? "bg-gray-900 text-white border border-gray-900"
                              : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {isAssigned && <Check size={10} />}
                          {item.is_shared ? "🤝 " : ""}{item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
