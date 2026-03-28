"use client";

import { useBoard } from "../context/BoardContext";

export default function PublishMenu() {
  const { isPublishSidebarOpen, setIsPublishSidebarOpen } = useBoard();

  return (
    <button
      onClick={() => setIsPublishSidebarOpen(!isPublishSidebarOpen)}
      className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${
        isPublishSidebarOpen 
          ? "bg-zinc-900 text-white border-zinc-700 shadow-inner" 
          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 shadow-sm"
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>
      </svg>
      ASSETS & EXPORT
    </button>
  );
}
