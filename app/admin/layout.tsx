"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (!loading && user && ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(user.uid)) {
      router.replace("/dashboard");
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
  if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(user.uid)) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 관리자 헤더 */}
      <header className="bg-gray-900 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="엔빵하기" width={26} height={26} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">엔빵하기</span>
            <span className="text-gray-500 text-xs">/</span>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-300">
              <LayoutDashboard size={12} />
              관리자
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Link href="/dashboard">
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">사용자 화면</span>
            </Link>
          </Button>
          <span className="text-xs text-gray-500 hidden sm:block">{user.displayName ?? user.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-1.5 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <LogOut size={13} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AuthProvider>
  );
}
