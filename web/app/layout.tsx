import type { Metadata, Viewport } from "next";
import { Host_Grotesk, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// Host Grotesk (graphql.org) for body / UI.
const sans = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Clean mono for numbers and code.
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// High-contrast serif for display headings, with a calligraphic italic.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tenor, the fixed rate market for Stellar",
  description:
    "Split any yield bearing Stellar asset into Principal and Yield tokens. Lock a fixed rate or trade the interest rate itself.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
