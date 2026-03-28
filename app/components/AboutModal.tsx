"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import logo from "../logo.png";

export default function AboutModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 shadow-sm group"
        title="About Omnidoku"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 transform group-hover:scale-110 transition-transform"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800/60 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative h-48 w-full bg-blue-600 dark:bg-blue-900 overflow-hidden flex items-center justify-center border-b border-blue-700 dark:border-blue-950">
                <img src={logo.src} alt="Omnidoku Logo" className="w-full h-full object-cover" />
            </div>

            <div className="p-8">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors z-20 mix-blend-difference"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 font-black drop-shadow-md"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
                    Welcome to Omnidoku
                  </h2>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    More than just a Sudoku game—a high-performance workspace for the modern grid designer.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">How to use</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-sm transition-all shadow-sm">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Design Mode
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed pl-3.5">
                        Anchor multiple grids, set up variants (like Windoku or Asterisk), and place permanent market digits to build your puzzle masterpiece. 
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-sm transition-shadow">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Play Mode
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-3.5">
                        Switch to solve the puzzle. Use standard digits and enjoy a focus-driven experience without the distraction of design tools.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-sm transition-shadow">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Solving Tech
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-3.5">
                          Utilize the built-in Z3 solver to check for uniqueness and validation scripts to ensure your rules are bulletproof.
                        </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                    <p className="text-[9px] font-black text-center text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">
                        Handcrafted for Sudoku Perfectionists
                    </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
