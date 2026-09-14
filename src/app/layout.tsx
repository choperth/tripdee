import type { Metadata } from "next";
import { Nunito, Noto_Sans_Thai, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";

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

export const metadata: Metadata = {
  title: "TripDee (ทริปดี) | รวมรถตู้ VIP รถเช่า และที่พักคุณภาพ เชียงใหม่",
  description: "ทริปดีๆ เริ่มต้นที่นี่ รวมรถตู้ VIP พร้อมคนขับ รถเช่าขับเอง SUV และที่พักแนะนำในเชียงใหม่ ติดต่อคนขับตรง ไม่บวกค่านายหน้า ปลอดภัย มั่นใจได้ 100% พร้อมบริการลูกค้าองค์กรและออกใบกำกับภาษี",
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
        <script
          type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('td-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;var l=localStorage.getItem('td-lang');document.documentElement.lang=l==='zh'?'zh-CN':l==='en'?'en':'th';}catch(e){}})();`,
          }}
        />
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
