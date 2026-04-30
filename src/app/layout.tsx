import type { Metadata } from "next";
import "./globals.css";
import { LocaleWrapper } from "@/lib/i18n/LocaleWrapper";
import { Header } from "@/components/layouts/Header";
import { Footer } from "@/components/layouts/Footer";

export const metadata: Metadata = {
  title: "MDLooker - PPE Compliance Platform",
  description: "Global PPE compliance platform providing CE, FDA, UKCA certification guidance for personal protective equipment exporters.",
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
