"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Footer from "@/components/Footer";

function LandingContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="엔빵하기 로고" width={32} height={32} />
          <span className="font-bold text-lg text-gray-900">엔빵하기</span>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm w-full">
          {/* 로고 */}
          <div className="mb-10 flex flex-col items-center">
            <div className="mb-5">
              <Image src="/logo.svg" alt="엔빵하기" width={64} height={64} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">엔빵하기</h1>
            <p className="text-base text-gray-500">더치페이 정산, 이제 쉽게</p>
          </div>

          {/* 기능 소개 */}
          <div className="grid gap-2 mb-10 text-left">
            {[
              { label: "링크 하나로 공유" },
              { label: "자동으로 금액 계산" },
              { label: "입금 인증까지 관리" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full text-sm gap-2 bg-gray-900 hover:bg-gray-800 text-white border-0"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 방 만들기
            </Button>
            <p className="text-xs text-gray-400">참여자라면 방장에게 링크를 받아서 접속하세요</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
