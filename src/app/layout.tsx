import type { Metadata } from "next";
import "./globals.css";
import { LocaleWrapper } from "@/lib/i18n/LocaleWrapper";
import { Header } from "@/components/layouts/Header";
import { Footer } from "@/components/layouts/Footer";

export const metadata: Metadata = {
  title: "MDLooker - Global PPE Compliance Information Platform",
  description: "AI-powered PPE compliance platform covering 50,000+ certified products, 45+ countries, real-time regulation updates. Get instant compliance reports for CE, FDA, UKCA, NMPA certifications.",
  keywords: "PPE, personal protective equipment, compliance, CE marking, FDA 510(k), NMPA, certification, UKCA, regulatory compliance, PPE export, medical device registration",
  openGraph: {
    title: "MDLooker - Global PPE Compliance Information Platform",
    description: "AI-powered PPE compliance platform covering 50,000+ certified products, 45+ countries, real-time regulation updates.",
    url: "https://mdlooker.com",
    siteName: "MDLooker",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MDLooker - Global PPE Compliance Information Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MDLooker - Global PPE Compliance Information Platform",
    description: "AI-powered PPE compliance platform covering 50,000+ certified products, 45+ countries, real-time regulation updates.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://mdlooker.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <LocaleWrapper>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </LocaleWrapper>
      </body>
    </html>
  );
}
