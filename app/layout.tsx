import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = "https://nbbang.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "엔빵하기 — 더치페이 정산 서비스",
    template: "%s | 엔빵하기",
  },
  description: "모임, 회식, 배달음식 더치페이 정산을 가장 쉽게. 방 만들고 링크 공유하면 끝. 자동 금액 계산, AI 주문 파싱, 입금 인증까지.",
  keywords: [
    "더치페이", "정산", "엔빵", "N빵", "더치페이앱", "모임비 정산", "공동구매 정산",
    "회식 정산", "배달 정산", "더치페이 계산기", "정산 링크", "입금 인증",
    "더치페이 어플", "돈 모으기", "총무 앱",
  ],
  authors: [{ name: "Sungblab", url: "https://sungblab.com" }],
  creator: "Sungblab",
  publisher: "엔빵하기",
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "엔빵하기 — 더치페이 정산 서비스",
    description: "모임, 회식, 배달 더치페이를 링크 하나로. 자동 금액 계산 + 입금 인증까지.",
    type: "website",
    url: BASE_URL,
    locale: "ko_KR",
    siteName: "엔빵하기",
    images: [{ url: `${BASE_URL}/OG_image.png`, width: 1200, height: 630, alt: "엔빵하기 더치페이 정산 서비스" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "엔빵하기 — 더치페이 정산 서비스",
    description: "모임, 회식, 배달 더치페이를 링크 하나로. 자동 금액 계산 + 입금 인증까지.",
    images: [`${BASE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  category: "finance",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "엔빵하기",
  url: BASE_URL,
  description: "모임, 회식, 배달음식 더치페이 정산을 가장 쉽게. 방 만들고 링크 공유하면 끝.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: "ko",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  author: { "@type": "Person", name: "Sungblab", url: "https://sungblab.com" },
  featureList: [
    "더치페이 정산방 생성", "링크 공유로 참여자 초대", "자동 금액 계산",
    "AI 주문 내역 파싱", "입금 인증 사진 업로드", "입금 확인 관리",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
