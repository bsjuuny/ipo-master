import type { Metadata } from "next";

// page.tsx 가 'use client' 라 metadata 를 여기서 내보낸다.
export const metadata: Metadata = {
  title: "공모주 상장 수익률 분석",
  description: "지난 공모주의 공모가 대비 시초가·상장 수익률을 비교해 보세요.",
  alternates: { canonical: "https://bsjuuny2026.mycafe24.com/ipomaster/analysis/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
