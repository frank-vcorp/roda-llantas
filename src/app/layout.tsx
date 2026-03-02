import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

/**
 * IMPL-20260129-SPRINT1, PWA-20260131
 * Layout raíz de la aplicación con soporte PWA
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getPublicOrganizationSettings } from "@/lib/actions/settings";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicOrganizationSettings();
  const logoUrl = settings?.logo_url;
  const name = settings?.name || "RodaMAx";

  return {
    title: name,
    description: "Llantas, suspensiones y frenos en Querétaro",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: name,
    },
    formatDetection: { telephone: false },
    ...(logoUrl && {
      icons: {
        icon: [{ url: logoUrl }],
        apple: [{ url: logoUrl }],
        shortcut: [{ url: logoUrl }],
      },
    }),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster position="bottom-right" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
