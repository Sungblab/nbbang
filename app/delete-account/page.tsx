"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

function DeleteAccountContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(user);
      router.replace("/");
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "auth/requires-recent-login") {
        setError("보안을 위해 다시 로그인 후 탈퇴해 주세요. 로그아웃 후 재로그인하면 탈퇴가 가능합니다.");
      } else {
        setError("탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="엔빵하기" width={28} height={28} />
          <span className="font-bold text-base text-gray-900">엔빵하기</span>
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원탈퇴</h1>
          <p className="text-sm text-gray-500 mb-8">
            탈퇴하시면 모든 정산 방 데이터가 삭제되며 복구할 수 없습니다.
          </p>

          {!user ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                회원탈퇴를 하려면 먼저 로그인이 필요합니다.
              </p>
              <Button asChild variant="outline">
                <Link href="/">홈으로 돌아가기</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 현재 계정 정보 */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">탈퇴할 계정</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.displayName ?? user.email}
                </p>
                {user.displayName && (
                  <p className="text-xs text-gray-400">{user.email}</p>
                )}
              </div>

              {/* 주의사항 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">탈퇴 전 확인해 주세요</p>
                <ul className="space-y-2">
                  {[
                    "모든 정산 방이 즉시 삭제됩니다",
                    "참가자들은 더 이상 방에 접근할 수 없게 됩니다",
                    "업로드한 입금 인증 사진이 삭제됩니다",
                    "삭제된 데이터는 복구할 수 없습니다",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 text-gray-400">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 확인 체크박스 */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-gray-900"
                />
                <span className="text-sm text-gray-700">
                  위 내용을 확인했으며, 회원탈퇴에 동의합니다.
                </span>
              </label>

              {/* 에러 메시지 */}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
              )}

              {/* 버튼 */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={deleting}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-gray-900 hover:bg-red-600 text-white transition-colors"
                  disabled={!confirmed || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "탈퇴 처리 중..." : "회원탈퇴"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <AuthProvider>
      <DeleteAccountContent />
    </AuthProvider>
  );
}
