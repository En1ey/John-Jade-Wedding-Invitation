import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Great_Vibes } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "John&Jade Wedding Invitation",
  description: "Wedding Invitation Website for John and Jade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assests/img/logo.png" type="image/x-icon" />

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${greatVibes.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
