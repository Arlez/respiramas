import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";
import ThemeProvider from "@/components/ThemeProvider";
import MigrateMedTimes from '@/components/MigrateMedTimes';

export const metadata: Metadata = {
  title: "Respira Más",
  description: "Monitoreo y guía diaria para pacientes con enfermedades crónicas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vivir Mejor",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <ThemeProvider />
        <PWARegister />
        <MigrateMedTimes />
        <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
