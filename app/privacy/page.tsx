import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="엔빵하기" width={28} height={28} />
          <span className="font-bold text-base text-gray-900">엔빵하기</span>
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보 처리방침</h1>
        <p className="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 3월 13일</p>

        <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. 수집하는 개인정보</h2>
            <p>엔빵하기는 다음과 같은 정보를 수집합니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Google 계정 정보:</strong> 이름, 이메일 주소, 프로필 사진 (Google 로그인 시)</li>
              <li><strong>정산 데이터:</strong> 방 이름, 계좌 정보, 참가자 이름, 정산 금액</li>
              <li><strong>입금 인증 사진:</strong> 사용자가 직접 업로드한 이미지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. 개인정보 수집 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>더치페이 정산 서비스 제공</li>
              <li>사용자 인증 및 계정 관리</li>
              <li>입금 현황 관리 및 조회</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. 개인정보 보유 및 이용 기간</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>정산 방 데이터: 방 만료 후 30일 이내 자동 삭제</li>
              <li>계정 정보: 회원 탈퇴 시 즉시 삭제</li>
              <li>입금 인증 사진: 방 만료 후 30일 이내 자동 삭제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. 개인정보의 제3자 제공</h2>
            <p>
              엔빵하기는 사용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>법령에 의거하거나 수사기관의 적법한 요청이 있는 경우</li>
              <li>서비스 제공을 위해 불가피하게 필요한 경우 (Firebase, AWS 등 인프라 제공업체)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. 이용하는 외부 서비스</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Firebase (Google):</strong> 인증, 데이터베이스</li>
              <li><strong>Amazon S3:</strong> 이미지 저장</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. 사용자의 권리</h2>
            <p>사용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>개인정보 열람, 정정, 삭제 요청</li>
              <li>회원 탈퇴를 통한 모든 데이터 삭제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. 개인정보 보호 책임자</h2>
            <p>
              개인정보 처리에 관한 문의는 서비스 내 문의 채널을 통해 연락해 주시기 바랍니다.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
