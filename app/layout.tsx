import type { Metadata } from "next";
import { DM_Serif_Display, Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import BottomNav from "@/components/layout/bottom-nav";
import FloatingButton from "@/components/layout/floating-button";

/* Brand logo — Latin elegant serif */
const dmSerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

/* Korean editorial headings */
const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun",
  display: "swap",
});

/* Korean body / UI text */
const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapReview — 사진으로 리뷰 완성",
  description:
    "음식, 공간, 제품 사진을 올리면 AI가 리뷰를 써드립니다. 네이버·카카오·구글 어디에나 바로 붙여넣기.",
  keywords: ["리뷰", "사진 리뷰", "AI 리뷰", "자동 리뷰 생성"],
  openGraph: {
    title: "SnapReview — 사진으로 리뷰 완성",
    description:
      "음식, 공간, 제품 사진을 올리면 AI가 리뷰를 써드립니다. 네이버·카카오·구글 어디에나 바로 붙여넣기.",
    type: "website",
    locale: "ko_KR",
    siteName: "SnapReview",
  },
  twitter: {
    card: "summary",
    title: "SnapReview — 사진으로 리뷰 완성",
    description: "사진을 올리면 AI가 리뷰를 써드립니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${dmSerif.variable} ${gowunBatang.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
        <FloatingButton />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
