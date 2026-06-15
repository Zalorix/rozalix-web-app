import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { AuthProvider } from "@/lib/auth";
import { PWARegister } from "@/components/pwa/PWARegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rozalix Console",
  description: "CRM + CMS dashboard for Rozalix clients.",
  applicationName: "Rozalix",
  appleWebApp: { capable: true, title: "Rozalix", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        <PWARegister />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
