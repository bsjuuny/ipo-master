import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPO MASTER | 실시간 공모주 인텔리전스",
  description: "실시간 경쟁률, 수요예측, 상장 수익률까지 데이터로 완성하는 공모주 투자",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto glass-morphism px-8 py-3 flex justify-between items-center bg-black/40 border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic">M</div>
              <span className="text-xl font-black uppercase tracking-tighter premium-gradient-text">IPO Master</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-slate-300">
              <a href="/" className="hover:text-blue-400 transition-colors">대시보드</a>
              <a href="/calendar" className="hover:text-blue-400 transition-colors">공모일정</a>
              <a href="/analysis" className="hover:text-blue-400 transition-colors">수익률 분석</a>
            </div>
          </div>
        </nav>
        <main className="pt-28 px-6 max-w-7xl mx-auto">
          {children}
        </main>
        <footer className="mt-20 border-t border-white/5 py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <span className="font-black uppercase tracking-widest premium-gradient-text opacity-40">IPO Master</span>
            <span>데이터는 매일 평일 오전 4:16에 자동 수집됩니다. 투자 판단의 참고 자료로만 활용하세요.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
