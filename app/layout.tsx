import type { Metadata } from "next";
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

import Sidebar from "./components/Sidebar";
import { BoardProvider } from "./context/BoardContext";

export const metadata: Metadata = {
  title: "Omnidoku",
  description: "Sophisticated Sudoku platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
        <BoardProvider>
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/70 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
                Omnidoku
              </span>
            </div>
          </header>
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            
            <main className="flex-1 overflow-hidden relative h-full">
              {children}
            </main>
          </div>
        </BoardProvider>
      </body>
    </html>
  );
}
