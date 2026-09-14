import type { Metadata } from "next";
import { Nunito, Noto_Sans_Thai, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { getStructuredData } from "@/lib/structuredData";
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdee.co';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และที่พักคุณภาพ เชียงใหม่",
    template: "%s | TripDee ทริปดี",
  },
  description:
    "ทริปดีๆ เริ่มต้นที่นี่ รวมรถตู้ VIP พร้อมคนขับ รถเช่าขับเอง SUV และที่พักแนะนำในเชียงใหม่ ติดต่อคนขับตรง ไม่บวกค่านายหน้า ปลอดภัย ตรวจสอบเอกสารคนขับ พร้อมบริการลูกค้าองค์กรและออกใบกำกับภาษี",
  keywords: [
    "รถตู้เชียงใหม่",
    "เช่ารถตู้เชียงใหม่",
    "รถตู้ VIP เชียงใหม่",
    "รถเช่าเชียงใหม่",
    "ที่พักเชียงใหม่",
    "พูลวิลล่าม่อนแจ่ม",
    "ดอยอินทนนท์",
    "แม่กำปอง",
    "ทริปดี",
    "TripDee",
    "Chiang Mai van rental",
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
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: ["en_US", "zh_CN"],
    url: BASE_URL,
    siteName: "TripDee (ทริปดี) เชียงใหม่",
    title: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และที่พักคุณภาพ เชียงใหม่",
    description:
      "ทริปดีๆ เริ่มต้นที่นี่ ติดต่อคนขับตรง ไม่บวกค่านายหน้า รถตู้ VIP พร้อมคนขับ รถเช่าขับเอง และที่พักพาร์ตเนอร์ในเชียงใหม่ พร้อมใบเสนอราคาและใบกำกับภาษีเต็มรูปแบบ",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&h=630&q=85",
        width: 1200,
        height: 630,
        alt: "TripDee รวมรถตู้ VIP รถเช่า และที่พักคุณภาพ เชียงใหม่",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และที่พักคุณภาพ เชียงใหม่",
    description:
      "ทริปดีๆ เริ่มต้นที่นี่ ติดต่อคนขับตรง ไม่บวกค่านายหน้า รถตู้ VIP พร้อมคนขับ และที่พักพาร์ตเนอร์ในเชียงใหม่",
    images: [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&h=630&q=85",
    ],
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
        {/* JSON-LD Structured Data for AEO (Answer Engine Optimization) & Google Search */}
        {Object.entries(getStructuredData()).map(([key, schema]) => (
          <script
            key={key}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <LanguageProvider>
          <AuthProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
