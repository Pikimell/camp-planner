import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import css from "./layout.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Camp Planner — харчування та чергування в поході",
  description:
    "Планувальник походу: раціон, список покупок, розподіл продуктів між учасниками та справедливий графік чергувань.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={css["body"]}>
        <Sidebar />
        <div className={css["page"]}>{children}</div>
      </body>
    </html>
  );
}
