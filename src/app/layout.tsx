import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Shell } from "@/components/layout/Shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Share Transmission Management System",
  description: "CDC Share Registrar Services Limited - STMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-slate-50 font-sans antialiased", inter.variable)}>
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
