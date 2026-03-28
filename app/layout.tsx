import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Sidebar from "./components/Sidebar";
import PublishSidebar from "./components/PublishSidebar";
import GameModeToggle from "./components/GameModeToggle";
import PublishMenu from "./components/PublishMenu";
import AboutModal from "./components/AboutModal";
import { BoardProvider } from "./context/BoardContext";
import logo from "./logo.png";

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
      className={`${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
        <BoardProvider>
          <header className="sticky top-0 z-50 w-full border-b border-blue-700 bg-blue-600 backdrop-blur-md dark:border-blue-900 dark:bg-blue-900">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <img src={logo.src} alt="Omnidoku Logo" className="h-16 w-auto" />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <AboutModal />
                  <GameModeToggle />
                </div>
                <PublishMenu />
              </div>
            </div>
          </header>
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-hidden relative h-full">
              {children}
            </main>

            <PublishSidebar />
          </div>
        </BoardProvider>
      </body>
    </html>
  );
}
