"use client";

import { useBoard } from "../context/BoardContext";

export default function PublishMenu() {
  const { isPublishSidebarOpen, setIsPublishSidebarOpen } = useBoard();

  return (
    <button
      onClick={() => setIsPublishSidebarOpen(!isPublishSidebarOpen)}
      className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${
        isPublishSidebarOpen 
          ? "bg-white text-blue-600 border-white shadow-inner" 
          : "bg-white/10 text-white border-white/20 hover:bg-white/20 dark:hover:bg-white/20 shadow-sm"
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>
      </svg>
      PUZZLES & EXPORT
    </button>
  );
}
