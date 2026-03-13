import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col items-center sm:items-start gap-0.5">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} 엔빵하기. All rights reserved.
            </p>
            <a
              href="https://sungblab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Developed by Sungblab
            </a>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              이용약관
            </Link>
            <span className="text-gray-200">·</span>
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              개인정보 처리방침
            </Link>
            <span className="text-gray-200">·</span>
            <Link
              href="/delete-account"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              회원탈퇴
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
