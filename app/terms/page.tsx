import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="엔빵하기" width={28} height={28} />
          <span className="font-bold text-base text-gray-900">엔빵하기</span>
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
        <p className="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 3월 13일</p>

        <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제1조 (목적)</h2>
            <p>
              이 약관은 엔빵하기(이하 &ldquo;서비스&rdquo;)의 이용 조건 및 절차, 서비스 제공자와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제2조 (서비스 개요)</h2>
            <p>
              엔빵하기는 여러 사람이 함께한 식사, 모임 등의 비용을 편리하게 정산할 수 있도록 돕는 더치페이 정산 서비스입니다. 사용자는 정산 방을 생성하고 링크를 공유하여 참가자들의 입금을 관리할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제3조 (서비스 이용)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스는 Google 계정을 통해 로그인 후 이용 가능합니다.</li>
              <li>정산 방 호스트는 Google 계정이 필요하며, 참가자는 링크만으로 접속할 수 있습니다.</li>
              <li>서비스는 만 14세 이상의 사용자를 대상으로 합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제4조 (금지 행위)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>타인의 계정 또는 정보를 도용하는 행위</li>
              <li>서비스를 이용한 사기 또는 불법적인 금전 거래</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>허위 입금 인증 사진을 업로드하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제5조 (서비스 제공의 제한)</h2>
            <p>
              서비스 제공자는 서비스의 개선, 유지보수, 또는 기타 사유로 사전 통지 없이 서비스를 일시 중단하거나 변경할 수 있습니다. 서비스로 인한 금전적 손해에 대해 서비스 제공자는 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제6조 (저작권)</h2>
            <p>
              서비스 내 모든 콘텐츠의 저작권은 엔빵하기에 있으며, 무단 복제 또는 배포를 금합니다. 사용자가 업로드한 입금 인증 사진의 책임은 사용자 본인에게 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제7조 (약관의 변경)</h2>
            <p>
              서비스 제공자는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 고지합니다. 변경 후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">제8조 (문의)</h2>
            <p>
              이용약관에 관한 문의 사항은 서비스 내 문의 채널을 통해 연락해 주시기 바랍니다.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
