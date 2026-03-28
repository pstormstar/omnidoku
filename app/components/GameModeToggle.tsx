"use client";

import { useBoard } from "../context/BoardContext";

export default function GameModeToggle() {
  const { gameMode, setGameMode } = useBoard();

  return (
    <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
      <div 
        className={`absolute h-8 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-md ${
          gameMode === "design" ? "bg-zinc-900 dark:bg-zinc-50" : "bg-white dark:bg-zinc-600"
        }`}
        style={{ 
          width: 'calc(50% - 4px)', 
          left: gameMode === "play" ? 'calc(50% + 2px)' : '2px',
        }}
      />
      
      <button 
        onClick={() => setGameMode("design")}
        title="Design Mode: Add/edit grids and set permanent clues (marker digits)."
        className={`relative flex items-center justify-center gap-2 px-6 py-1.5 text-[11px] font-bold tracking-widest transition-colors duration-300 z-10 ${
          gameMode === "design" ? "text-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
      >
        DESIGN
      </button>

      <button 
        onClick={() => setGameMode("play")}
        title="Play Mode: Solve the puzzle using standard digits. Sidebar is disabled."
        className={`relative flex items-center justify-center gap-2 px-6 py-1.5 text-[11px] font-bold tracking-widest transition-colors duration-300 z-10 ${
          gameMode === "play" ? "text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        }`}
      >
        PLAY
      </button>
    </div>
  );
}
