import type { Metadata } from "next";
import Script from "next/script";
import { Nunito, Noto_Sans_Thai, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { getStructuredData } from "@/lib/structuredData";
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdee.co';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TripDee (ทริปดี) | รวมรถตู้พร้อมคนขับ รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
    template: "%s | TripDee ทริปดี",
  },
  description:
    "ทริปดีๆ เริ่มต้นที่นี่ รวมรถตู้พร้อมคนขับ รถเช่าขับเอง SUV และสิทธิพิเศษการเดินทางทั่วไทย (กรุงเทพฯ, เชียงใหม่, ภูเก็ต, พัทยา, เขาใหญ่, หัวหิน) ติดต่อคนขับตรง 0% ค่านายหน้า ปลอดภัย ตรวจสอบเอกสารคนขับ พร้อมบริการลูกค้าองค์กรและออกใบกำกับภาษี",
  keywords: [
    "รถตู้พร้อมคนขับ ทั่วไทย",
    "เช่ารถตู้พร้อมคนขับ",
    "เช่ารถตู้",
    "รถตู้กรุงเทพ",
    "รถตู้เชียงใหม่",
    "รถตู้ภูเก็ต",
    "รถตู้พัทยา",
    "รถตู้เขาใหญ่",
    "รถตู้หัวหิน",
    "รถเช่าขับเอง",
    "ทริปดี",
    "TripDee",
    "Thailand van rental with driver",
    "private driver Thailand",
  ],
  authors: [{ name: "TripDee", url: BASE_URL }],
  creator: "TripDee",
  publisher: "TripDee",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "/",
    languages: {
      "th-TH": "/?lang=th",
      "en-US": "/?lang=en",
      "zh-CN": "/?lang=zh",
    },
  },
  icons: {
    icon: "/app-icon.png",
    shortcut: "/app-icon.png",
    apple: "/app-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: ["en_US", "zh_CN"],
    url: BASE_URL,
    siteName: "TripDee (ทริปดี)",
    title: "TripDee (ทริปดี) | รวมรถตู้พร้อมคนขับ รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
    description:
      "ทริปดีๆ เริ่มต้นที่นี่ ติดต่อคนขับตรง 0% ค่านายหน้า รถตู้พร้อมคนขับ รถเช่าขับเอง และสิทธิพิเศษการเดินทางทั่วไทย พร้อมใบเสนอราคาและใบกำกับภาษีเต็มรูปแบบ",
    images: [
      {
        url: `${BASE_URL}/hero-banner.png`,
        width: 1024,
        height: 381,
        alt: "TripDee รวมรถตู้พร้อมคนขับ รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripDee (ทริปดี) | รวมรถตู้พร้อมคนขับ รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
    description:
      "ทริปดีๆ เริ่มต้นที่นี่ ติดต่อคนขับตรง 0% ค่านายหน้า รถตู้พร้อมคนขับ และสิทธิพิเศษการเดินทางทั่วไทย",
    images: [`${BASE_URL}/hero-banner.png`],
  },
  other: {
    "geo.region": "TH-50",
    "geo.placename": "Chiang Mai",
    "geo.position": "18.7883;98.9853",
    ICBM: "18.7883, 98.9853",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="th" suppressHydrationWarning className={`${nunito.variable} ${notoThai.variable} ${notoSC.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <script async src="/theme.js" />
        {Object.entries(getStructuredData()).map(([key, schema]) => (
          <script
            key={key}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-paper text-ink font-body">
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <LanguageProvider>
          <AuthProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
