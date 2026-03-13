"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2 } from "lucide-react";

interface Props {
  shareToken: string;
  roomName: string;
}

export function ShareSection({ shareToken, roomName }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${shareToken}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `[엔빵하기] ${roomName}`,
        text: `${roomName} 정산에 참여해주세요!`,
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">참여 링크 공유</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 flex-1 truncate">{shareUrl}</p>
          <button onClick={handleCopy} className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2" onClick={handleShare}>
            <Share2 size={16} />
            링크 공유하기
          </Button>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? "복사됨" : "복사"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
