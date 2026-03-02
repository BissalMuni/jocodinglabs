import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tech Tracker — 조코딩 AI뉴스 기술 목록",
  description: "조코딩 AI 뉴스에서 소개된 AI 기술들을 한눈에 확인하고 실습을 추적하세요",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
