import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import FooterWrapper from "@/components/FooterWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gajan Traders — International Courier from India",
  description: "Ship parcels from India to 200+ countries. Door-to-door pickup, real-time tracking, delivery you can count on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div className="noise-overlay" />
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {children}
            <FooterWrapper />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
