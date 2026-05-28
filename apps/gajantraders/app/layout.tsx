import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans, Anek_Devanagari } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import FooterWrapper from "@/components/FooterWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const anek = Anek_Devanagari({
  variable: "--font-anek",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gajan Traders - International Courier Services",
  description: "Delivering excellence globally. Track your shipments, get quotes, and experience seamless international logistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} ${anek.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
