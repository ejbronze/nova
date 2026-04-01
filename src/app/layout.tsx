import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/shared/Nav";
import { ClientInit } from "@/components/shared/ClientInit";
import { AuthGate } from "@/components/shared/AuthGate";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Nova — Your Life OS",
  description: "Personal administration app for money, health, and life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerif.variable} font-sans bg-nova-bg text-nova-text antialiased`}>
        <AuthGate>
          <ClientInit />
          <Nav />
          <main className="max-w-[1200px] mx-auto px-6 py-7">
            {children}
          </main>
        </AuthGate>
      </body>
    </html>
  );
}
