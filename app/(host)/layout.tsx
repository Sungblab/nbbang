"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Footer from "@/components/Footer";

function HostGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <a href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="엔빵하기" width={28} height={28} />
          <span className="font-bold text-base text-gray-900">엔빵하기</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">
            {user.displayName ?? user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-gray-500 hover:text-gray-900">
            <LogOut size={14} />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>

      <Footer />
    </div>
  );
}

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HostGuard>{children}</HostGuard>
    </AuthProvider>
  );
}
