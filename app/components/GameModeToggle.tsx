"use client";

import { useBoard } from "../context/BoardContext";

export default function GameModeToggle() {
  const { gameMode, setGameMode } = useBoard();

  return (
    <div className="relative flex items-center bg-white/10 p-1 rounded-full border border-white/10 shadow-sm">
      <div 
        className={`absolute h-8 rounded-full shadow-md ${
          gameMode === "design" ? "bg-white text-blue-600" : "bg-white/90 text-blue-600"
        }`}
        style={{ 
          width: 'calc(50% - 4px)', 
          left: gameMode === "play" ? 'calc(50% + 2px)' : '2px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      
      <button 
        onClick={() => setGameMode("design")}
        title="Design Mode: Add/edit grids and set permanent clues (marker digits)."
        className={`relative flex-1 w-[100px] flex items-center justify-center gap-2 py-1.5 text-[11px] font-black tracking-widest z-10 transition-colors duration-300 ${
          gameMode === "design" ? "text-blue-600" : "text-white/60 hover:text-white"
        }`}
      >
        DESIGN
      </button>

      <button 
        onClick={() => setGameMode("play")}
        title="Play Mode: Solve the puzzle using standard digits. Sidebar is disabled."
        className={`relative flex-1 w-[100px] flex items-center justify-center gap-2 py-1.5 text-[11px] font-black tracking-widest z-10 transition-colors duration-300 ${
          gameMode === "play" ? "text-blue-600" : "text-white/60 hover:text-white"
        }`}
      >
        PLAY
      </button>
    </div>
  );
}
