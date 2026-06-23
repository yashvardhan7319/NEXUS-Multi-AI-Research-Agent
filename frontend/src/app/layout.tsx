import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "MRLA — Multi-Agent Research & Literature Analyzer",
  description:
    "Multi-Agent Research & Literature Analyzer (MRLA) leverages sequential LangChain agents to search, read, write, and critique comprehensive literature reviews.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="relative min-h-screen bg-bg text-text transition-colors duration-300">
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}
