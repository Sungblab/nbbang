"use client";

import { useState } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, User } from "lucide-react";

interface Props {
  roomId: string;
  menuItems: MenuItem[];
}

export function MenuSection({ roomId, menuItems }: Props) {
  const [form, setForm] = useState({ name: "", price: "", qty: "1", is_shared: false });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setAdding(true);
    await addDoc(collection(db, "rooms", roomId, "menu_items"), {
      name: form.name,
      price: parseInt(form.price.replace(/,/g, "")),
      qty: parseInt(form.qty) || 1,
      is_shared: form.is_shared,
    });
    setForm({ name: "", price: "", qty: "1", is_shared: false });
    setShowForm(false);
    setAdding(false);
  };

  const handleDelete = async (itemId: string) => {
    await deleteDoc(doc(db, "rooms", roomId, "menu_items", itemId));
  };

  const toggleShared = async (item: MenuItem) => {
    await updateDoc(doc(db, "rooms", roomId, "menu_items", item.id), {
      is_shared: !item.is_shared,
    });
  };

  const totalAmount = menuItems.reduce((sum, m) => sum + m.price * m.qty, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">메뉴 목록</CardTitle>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} />
          메뉴 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
            <Input
              placeholder="메뉴명"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <div className="flex gap-2">
              <Input
                placeholder="금액 (원)"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, "") }))}
                inputMode="numeric"
                className="flex-1"
                required
              />
              <Input
                placeholder="수량"
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                inputMode="numeric"
                className="w-20"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_shared}
                onChange={(e) => setForm((f) => ({ ...f, is_shared: e.target.checked }))}
                className="rounded accent-gray-900"
              />
              <span className="text-gray-600">공유 메뉴 (N빵)</span>
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding} className="flex-1">
                {adding ? "추가 중..." : "추가"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </form>
        )}

        {menuItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">메뉴를 추가해주세요</p>
        ) : (
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleShared(item)}
                    className="shrink-0"
                    title={item.is_shared ? "공유 메뉴 → 개인으로" : "개인 → 공유 메뉴"}
                  >
                    <Badge variant={item.is_shared ? "default" : "outline"} className="gap-1 cursor-pointer">
                      {item.is_shared ? <Users size={10} /> : <User size={10} />}
                      {item.is_shared ? "공유" : "개인"}
                    </Badge>
                  </button>
                  <span className="text-sm font-medium text-gray-800">
                    {item.name} {item.qty > 1 && <span className="text-gray-400">×{item.qty}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {(item.price * item.qty).toLocaleString()}원
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-semibold text-gray-900">
              <span>합계</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
