import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Optimizer — Pipeline Dashboard",
  description: "Cloudflare for AI APIs. Customizable middleware pipeline for LLM requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] antialiased flex">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <div className="fixed bottom-6 right-6 z-20">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
