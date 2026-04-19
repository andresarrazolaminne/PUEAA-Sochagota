import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { SiteBrandBar } from "@/components/site/SiteBrandBar";
import { RetroSoundscape } from "@/components/sounds/RetroSoundscape";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "PUEAA Sochagota",
  description: "Plataforma de gamificación — uso eficiente del agua",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body className="game-scanlines flex min-h-full flex-col">
        <Suspense
          fallback={
            <div
              className="h-14 shrink-0 border-b-4 border-[#1e3a5f] bg-[#e8f2fa]"
              aria-hidden
            />
          }
        >
          <SiteBrandBar />
        </Suspense>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <RetroSoundscape />
      </body>
    </html>
  );
}
