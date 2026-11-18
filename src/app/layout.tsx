import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

const SITE_URL = "https://bsjuuny2026.mycafe24.com/ipomaster/";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 공모주 상세는 "회사명 공모주 청약 일정·공모가 | IPO Master" 로 나온다.
  title: { default: "IPO MASTER | 공모주 청약 일정·수요예측·경쟁률", template: "%s | IPO Master" },
  description: "이번 주 공모주 청약 일정, 희망 공모가, 기관 수요예측 경쟁률, 상장일과 상장 수익률을 한눈에 보는 공모주 정보 사이트",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "IPO MASTER | 공모주 인텔리전스",
    description: "경쟁률, 수요예측, 상장 수익률까지 데이터로 보는 공모주 정보",
    url: SITE_URL,
    siteName: "IPO Master",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen font-outfit">
        <Navigation />
        <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto">
          {children}
        </main>
        <footer className="mt-20 border-t border-white/5 py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <span className="font-black uppercase tracking-widest premium-gradient-text opacity-40">IPO Master</span>
            <span>데이터는 평일 오전 자동 수집됩니다. 투자 판단의 참고 자료로만 활용하세요.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
