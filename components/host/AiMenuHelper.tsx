"use client";

import { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Sparkles, Camera, X, Plus, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";

interface ParsedItem {
  name: string;
  price: number;
  qty: number;
  is_shared: boolean;
}

interface AiResult {
  items: ParsedItem[];
  message?: string;
}

interface Props {
  roomId: string;
  onAdded: () => void;
}

export function AiMenuHelper({ roomId, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [addedDone, setAddedDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!text.trim() && !imageFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAddedDone(false);

    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text.trim());
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/ai/analyze", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "분석 실패");
      if (!data.items?.length) throw new Error("메뉴 항목을 찾을 수 없어요. 다시 시도해주세요.");

      setResult(data);
      setItems(data.items.map((item: ParsedItem) => ({ ...item })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAll = async () => {
    setAdding(true);
    try {
      await Promise.all(
        items.map((item) =>
          addDoc(collection(db, "rooms", roomId, "menu_items"), {
            name: item.name,
            price: item.price,
            qty: item.qty,
            is_shared: item.is_shared,
          })
        )
      );
      setAddedDone(true);
      onAdded();
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 1200);
    } catch {
      setError("메뉴 추가 중 오류가 발생했어요.");
    } finally {
      setAdding(false);
    }
  };

  const resetState = () => {
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setItems([]);
    setAddedDone(false);
  };

  const updateItem = (idx: number, field: keyof ParsedItem, value: string | number | boolean) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* 토글 버튼 */}
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
        onClick={() => { setOpen((v) => !v); if (open) resetState(); }}
      >
        <Sparkles size={14} className="text-gray-500" />
        AI 분석
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </Button>

      {/* 패널 */}
      {open && (
        <div className="mt-3 border border-gray-100 rounded-xl bg-gray-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-800">AI 메뉴 분석</span>
            </div>
            <button onClick={() => { setOpen(false); resetState(); }} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>

          {/* 이미지 업로드 */}
          <div>
            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="분석할 이미지"
                  className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-gray-500 hover:text-gray-800"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
              >
                <Camera size={18} className="mx-auto mb-1.5 opacity-50" />
                영수증 또는 메뉴판 사진 업로드
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* 텍스트 입력 */}
          <div>
            <textarea
              placeholder={`메뉴를 직접 입력하거나 사진을 첨부하세요.\n예) 삼겹살 2인분 15000원, 냉면 2개 각 9000원`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-300"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* 분석 버튼 */}
          {!result && (
            <Button
              className="w-full gap-2 bg-gray-900 hover:bg-gray-800 text-white"
              disabled={loading || (!text.trim() && !imageFile)}
              onClick={handleAnalyze}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  분석하기
                </>
              )}
            </Button>
          )}

          {/* 결과 */}
          {result && items.length > 0 && (
            <div className="space-y-3">
              {result.message && (
                <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
                  {result.message}
                </p>
              )}

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg border border-gray-100 p-3 space-y-2"
                  >
                    {/* 메뉴명 */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-900 pb-0.5"
                      />
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* 금액/수량/공유 */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(idx, "price", parseInt(e.target.value) || 0)}
                          className="w-24 text-sm text-gray-700 bg-gray-50 rounded border border-gray-200 px-2 py-1 focus:outline-none focus:border-gray-900"
                        />
                        <span className="text-xs text-gray-400">원</span>
                        <span className="text-gray-300 mx-1">×</span>
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 1)}
                          className="w-12 text-sm text-gray-700 bg-gray-50 rounded border border-gray-200 px-2 py-1 focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.is_shared}
                          onChange={(e) => updateItem(idx, "is_shared", e.target.checked)}
                          className="accent-gray-900"
                        />
                        공유
                      </label>
                      <span className="text-xs font-semibold text-gray-800 ml-auto">
                        {(item.price * item.qty).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 합계 */}
              <div className="flex justify-between text-sm font-semibold text-gray-900 px-1">
                <span>합계</span>
                <span>{items.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()}원</span>
              </div>

              {/* 추가 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setResult(null); setText(""); setImageFile(null); setImagePreview(null); }}
                >
                  다시 분석
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={adding || addedDone || items.length === 0}
                  onClick={handleAddAll}
                >
                  {addedDone ? (
                    <><Check size={13} /> 추가 완료!</>
                  ) : adding ? (
                    <><Loader2 size={13} className="animate-spin" /> 추가 중...</>
                  ) : (
                    <><Plus size={13} /> 메뉴에 추가 ({items.length}개)</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
