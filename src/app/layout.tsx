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
  icons: {
    icon: [
      { url: "/respiramas.png", sizes: "192x192", type: "image/png" },
      { url: "/respiramas.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/respiramas.png",
    shortcut: "/respiramas.png",
  },
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
        <meta name="theme-color" content="#16a34a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* PNG favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon-128.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />

        {/* Apple touch icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />

        {/* Apple startup / splash images for common iPhone sizes */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />

        {/* Windows tile color */}
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-TileImage" content="/favicon-192.png" />
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
