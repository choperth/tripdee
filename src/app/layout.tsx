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
    default: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
    template: "%s | TripDee ทริปดี",
  },
  description:
    "ทริปดีๆ เริ่มต้นที่นี่ รวมรถตู้ VIP พร้อมคนขับ รถเช่าขับเอง SUV และสิทธิพิเศษการเดินทางทั่วไทย (กรุงเทพฯ, เชียงใหม่, ภูเก็ต, พัทยา, เขาใหญ่, หัวหิน) ติดต่อคนขับตรง 0% ค่านายหน้า ปลอดภัย ตรวจสอบเอกสารคนขับ พร้อมบริการลูกค้าองค์กรและออกใบกำกับภาษี",
  keywords: [
    "รถตู้ VIP ทั่วไทย",
    "เช่ารถตู้พร้อมคนขับ",
    "รถตู้กรุงเทพ",
    "รถตู้เชียงใหม่",
    "รถตู้ภูเก็ต",
    "รถตู้พัทยา",
    "รถตู้เขาใหญ่",
    "รถตู้หัวหิน",
    "รถเช่าขับเอง",
    "ทริปดี",
    "TripDee",
    "Thailand VIP van rental",
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
    title: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
    description:
      "ทริปดีๆ เริ่มต้นที่นี่ ติดต่อคนขับตรง 0% ค่านายหน้า รถตู้ VIP พร้อมคนขับ รถเช่าขับเอง และสิทธิพิเศษการเดินทางทั่วไทย พร้อมใบเสนอราคาและใบกำกับภาษีเต็มรูปแบบ",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&h=630&q=85",
        width: 1200,
        height: 630,
        alt: "TripDee รวมรถตู้ VIP รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และสิทธิพิเศษการเดินทาง ทั่วไทย",
    description:
      "ทริปดีๆ เริ่มต้นที่นี่ ติดต่อคนขับตรง 0% ค่านายหน้า รถตู้ VIP พร้อมคนขับ และสิทธิพิเศษการเดินทางทั่วไทย",
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
