import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import { SiteBrandBar } from "@/components/site/SiteBrandBar";
import { RetroSoundscape } from "@/components/sounds/RetroSoundscape";
import { getUiThemeForLayout } from "@/lib/services/settings/campaign-branding-bundle";
import { themeToStyleBlock } from "@/lib/services/settings/ui-theme";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uiTheme = await getUiThemeForLayout();
  const themeCss =
    uiTheme && Object.keys(uiTheme).length > 0 ? themeToStyleBlock(uiTheme) : null;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body className="game-scanlines flex min-h-full flex-col">
        {themeCss ? (
          <style
            id="pueaa-ui-theme-overrides"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        ) : null}
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
