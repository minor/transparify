import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Transparify",
  description:
    "Transparify is a service that provides real-time livestream fact-checking and emotional analysis for a more informed and transparent viewing experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className + " h-full"}>{children}</body>
    </html>
  );
}
