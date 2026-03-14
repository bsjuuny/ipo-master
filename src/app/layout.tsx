import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "IPO MASTER | 공모주 인텔리전스",
  description: "경쟁률, 수요예측, 상장 수익률까지 데이터로 완성하는 공모주 투자",
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
