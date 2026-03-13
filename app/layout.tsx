import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "엔빵하기 — 더치페이 정산 서비스",
    template: "%s | 엔빵하기",
  },
  description: "더치페이 정산을 가장 쉽게. 방 만들고 링크 공유하면 끝. 입금 인증까지 자동으로.",
  keywords: ["더치페이", "정산", "엔빵", "N빵", "더치페이앱", "모임비", "공동구매"],
  authors: [{ name: "엔빵하기" }],
  creator: "엔빵하기",
  metadataBase: new URL("https://nbbang.vercel.app"),
  openGraph: {
    title: "엔빵하기 — 더치페이 정산 서비스",
    description: "더치페이 정산을 가장 쉽게. 방 만들고 링크 공유하면 끝.",
    type: "website",
    locale: "ko_KR",
    siteName: "엔빵하기",
  },
  twitter: {
    card: "summary",
    title: "엔빵하기 — 더치페이 정산 서비스",
    description: "더치페이 정산을 가장 쉽게. 방 만들고 링크 공유하면 끝.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
