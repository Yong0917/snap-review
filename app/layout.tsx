import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import BottomNav from "@/components/layout/bottom-nav";
import FloatingButton from "@/components/layout/floating-button";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  style: "normal",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#c85520",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "SnapReview — 사진으로 리뷰 완성",
  description:
    "음식, 공간, 제품 사진을 올리면 AI가 리뷰를 써드립니다. 네이버·카카오·구글 어디에나 바로 붙여넣기.",
  keywords: ["리뷰", "사진 리뷰", "AI 리뷰", "자동 리뷰 생성"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SnapReview",
  },
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
      className={`${pretendard.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans">
        <main
          className="flex-1 pb-20"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
        <FloatingButton />
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
