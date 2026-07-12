import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/layout/NavBar";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ToastProvider } from "@/lib/toast/ToastProvider";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konobar",
  description: "QR table ordering for restaurants and cafes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeRegistry>
          <ToastProvider>
            <AuthProvider>
              <NavBar />
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
