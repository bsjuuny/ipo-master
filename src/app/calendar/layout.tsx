import type { Metadata } from "next";

// page.tsx 가 'use client' 라 metadata 를 여기서 내보낸다.
export const metadata: Metadata = {
  title: "공모주 청약 캘린더",
  description: "공모주 청약·환불·상장 일정을 달력으로 확인하세요.",
  alternates: { canonical: "https://bsjuuny2026.mycafe24.com/ipomaster/calendar/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
