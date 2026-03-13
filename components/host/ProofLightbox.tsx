"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  imageKey: string | null;
  onClose: () => void;
}

export function ProofLightbox({ imageKey, onClose }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageKey) { setImageUrl(null); return; }
    fetch(`/api/proof/view?key=${encodeURIComponent(imageKey)}`)
      .then((r) => r.json())
      .then((data) => setImageUrl(data.url));
  }, [imageKey]);

  if (!imageKey) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300"
        onClick={onClose}
      >
        <X size={28} />
      </button>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="인증 사진"
          className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      )}
    </div>
  );
}
