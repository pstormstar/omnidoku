"use client";

import { useState, useRef } from "react";
import { useBoard } from "../context/BoardContext";
import { createEmptyPuzzle } from "../utils/puzzleUtils";
import { generateAutoRules } from "../utils/rulesUtils";

const TABS = ["General", "Clues", "Description"] as const;
type Tab = (typeof TABS)[number];

const CLUE_SUBTABS = ["region", "adjacent", "outside", "global"] as const;
type ClueSubtab = (typeof CLUE_SUBTABS)[number];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [activeClueSubtab, setActiveClueSubtab] = useState<ClueSubtab>("region");
  
  const {
    gameMode, setGameMode,
    puzzle, setPuzzle,
    selectedGridId, setSelectedGridId,
    isAddingGrid, setIsAddingGrid,
    selectionMode, setSelectionMode,
    removeGrid,
    activeClueType, setActiveClueType,
    activeClueSubType, setActiveClueSubType,
    setClueSelectionFirst,
    sandwichSum, setSandwichSum
  } = useBoard();
  const [isMinimized, setIsMinimized] = useState(false);
  const [width, setWidth] = useState(33); // Starting with 33%
  const [isDragging, setIsDragging] = useState(false);
  
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string; details?: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const [uniqueResult, setUniqueResult] = useState<{ status: string; message: string; details?: string } | null>(null);
  const [isCheckingUnique, setIsCheckingUnique] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  };

  const stopResizing = () => {
    isResizing.current = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 15 && newWidth < 50) setWidth(newWidth);
  };

  const isPlayMode = gameMode === "play";

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(puzzle)
      });
      const data = await res.json();
      setValidationResult({ 
        valid: data.valid, 
        message: data.message,
        details: data.output || ""
      });
    } catch (err) {
      setValidationResult({ valid: false, message: "Validation Failed", details: "Failed to connect to the validation server." });
    }
    setIsValidating(false);
  };

  const handleCheckUnique = async () => {
    setIsCheckingUnique(true);
    try {
      const res = await fetch("/api/check_unique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(puzzle)
      });
      const data = await res.json();
      setUniqueResult({ 
        status: data.status, 
        message: data.message,
        details: data.output || ""
      });
    } catch (err) {
      setUniqueResult({ status: "error", message: "Search Failed", details: "Failed to connect to the uniqueness solver." });
    }
    setIsCheckingUnique(false);
  };

  const isWindokuActive = selectedGridId && puzzle.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("windoku-"));

  const toggleWindoku = () => {
    if (!selectedGridId) return;
    setPuzzle(prev => {
      const next = { ...prev, regions: [...prev.regions] };
      const hasWindoku = next.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("windoku-"));
      if (hasWindoku) {
        next.regions = next.regions.filter(r => r.gridId !== selectedGridId || !r.id.startsWith("windoku-"));
      } else {
        const grid = prev.grids.find(g => g.id === selectedGridId);
        if (!grid) return prev;
        
        const offsets = [
          { r: 1, c: 1 }, { r: 1, c: 5 },
          { r: 5, c: 1 }, { r: 5, c: 5 }
        ];
        
        offsets.forEach((pos, idx) => {
          const cells = [];
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              cells.push({ r: grid.r + pos.r + i, c: grid.c + pos.c + j });
            }
          }
          next.regions.push({
            id: `windoku-${selectedGridId}-${idx}`,
            type: "variant",
            cells,
            gridId: selectedGridId
          });
        });
      }
      return next;
    });
  };

  const isDiagonalActive = selectedGridId && puzzle.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("diagonal-"));

  const isAsteriskActive = selectedGridId && puzzle.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("asterisk-"));

  const toggleAsterisk = () => {
    if (!selectedGridId) return;
    setPuzzle(prev => {
      const next = { ...prev, regions: [...prev.regions] };
      const hasAsterisk = next.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("asterisk-"));
      if (hasAsterisk) {
        next.regions = next.regions.filter(r => r.gridId !== selectedGridId || !r.id.startsWith("asterisk-"));
      } else {
        const grid = prev.grids.find(g => g.id === selectedGridId);
        if (!grid) return prev;
        
        const centerR = grid.r + 4;
        const centerC = grid.c + 4;
        const asteriskCells = [
          {r: centerR, c: centerC}, // Center
          {r: centerR - 3, c: centerC}, // Top
          {r: centerR + 3, c: centerC}, // Bottom
          {r: centerR, c: centerC - 3}, // Left
          {r: centerR, c: centerC + 3}, // Right
          {r: centerR - 2, c: centerC - 2}, // Top Left
          {r: centerR - 2, c: centerC + 2}, // Top Right
          {r: centerR + 2, c: centerC - 2}, // Bottom Left
          {r: centerR + 2, c: centerC + 2}, // Bottom Right
        ];
        
        next.regions.push({
          id: `asterisk-${selectedGridId}`,
          type: "variant",
          cells: asteriskCells,
          gridId: selectedGridId
        });
      }
      return next;
    });
  };

  const isCenterDotsActive = selectedGridId && puzzle.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("centerdots-"));

  const toggleCenterDots = () => {
    if (!selectedGridId) return;
    setPuzzle(prev => {
      const next = { ...prev, regions: [...prev.regions] };
      const hasCenterDots = next.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("centerdots-"));
      if (hasCenterDots) {
        next.regions = next.regions.filter(r => r.gridId !== selectedGridId || !r.id.startsWith("centerdots-"));
      } else {
        const grid = prev.grids.find(g => g.id === selectedGridId);
        if (!grid) return prev;
        
        const centerCells = [];
        for (let bx = 0; bx < 3; bx++) {
          for (let by = 0; by < 3; by++) {
            centerCells.push({ r: grid.r + bx * 3 + 1, c: grid.c + by * 3 + 1 });
          }
        }
        
        next.regions.push({
          id: `centerdots-${selectedGridId}`,
          type: "variant",
          cells: centerCells,
          gridId: selectedGridId
        });
      }
      return next;
    });
  };

  const toggleDiagonal = () => {
    if (!selectedGridId) return;
    setPuzzle(prev => {
      const next = { ...prev, regions: [...prev.regions] };
      const hasDiagonal = next.regions.some(r => r.gridId === selectedGridId && r.id.startsWith("diagonal-"));
      if (hasDiagonal) {
        next.regions = next.regions.filter(r => r.gridId !== selectedGridId || !r.id.startsWith("diagonal-"));
      } else {
        const grid = prev.grids.find(g => g.id === selectedGridId);
        if (!grid) return prev;
        
        const diag1 = [], diag2 = [];
        for (let i = 0; i < 9; i++) {
            diag1.push({ r: grid.r + i, c: grid.c + i });
            diag2.push({ r: grid.r + i, c: grid.c + (9 - 1 - i) });
        }
        next.regions.push({ id: `diagonal-${selectedGridId}-1`, type: "variant", cells: diag1, gridId: selectedGridId });
        next.regions.push({ id: `diagonal-${selectedGridId}-2`, type: "variant", cells: diag2, gridId: selectedGridId });
      }
      return next;
    });
  };

  if (isPlayMode) {
    return (
      <aside className="w-10 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-center relative overflow-hidden flex-shrink-0">
        <div className="whitespace-nowrap -rotate-90 origin-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 select-none">
          DESIGN MODE REQUIRED
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={sidebarRef}
      style={{ width: isMinimized ? "64px" : `${width}%` }}
      className={`flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50 hidden md:flex flex-col relative`}
    >
      {/* Minimize / Expand Toggle */}
      {!isPlayMode && (
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center z-[60] shadow-sm hover:scale-110 active:scale-95 transition-all text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
        >
          {isMinimized ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}/></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 19l-7-7 7-7M19 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}/></svg>
          )}
        </button>
      )}

      {/* Resize Handle */}
      {!isMinimized && !isPlayMode && (
        <div
          onMouseDown={startResizing}
          className={`absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors z-[60] ${isDragging ? "bg-zinc-900/10 dark:bg-white/10" : ""}`}
        />
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0 z-[50]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={isPlayMode}
            className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              } ${isMinimized || isPlayMode ? "p-4 border-b-0 border-r-2" : ""}`}
            title={tab}
          >
            {isMinimized || isPlayMode ? tab.charAt(0) : tab}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto ${isMinimized || isPlayMode ? "hidden" : "p-6"}`}>
        {activeTab === "General" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 italic">
                General Tools
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                You are currently in <strong>Design Mode</strong> (see top bar). Use these tools to build your multisudoku.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  title="Check if the current digits follow standard Sudoku rules."
                  className="py-3 rounded-xl bg-violet-500 hover:bg-violet-600 active:scale-95 disabled:opacity-50 transition-all text-white text-[9px] font-black tracking-widest uppercase flex flex-col items-center justify-center gap-1.5 shadow-sm"
                >
                  {isValidating ? (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10} strokeOpacity={0.2}/><path d="M12 2a10 10 0 0110 10" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                  )}
                  CHECK VALIDITY
                </button>

                <button
                  onClick={handleCheckUnique}
                  disabled={isCheckingUnique}
                  title="Analyze the puzzle to see if it has exactly one solution."
                  className="py-3 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 disabled:opacity-50 transition-all text-white text-[9px] font-black tracking-widest uppercase flex flex-col items-center justify-center gap-1.5 shadow-sm"
                >
                  {isCheckingUnique ? (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10} strokeOpacity={0.2}/><path d="M12 2a10 10 0 0110 10" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                  )}
                  CHECK UNIQUE
                </button>
              </div>

              {/* Multisudoku List */}
              <div className="space-y-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Multisudoku Grids
                  </label>
                  <span className="text-[10px] font-bold text-zinc-300 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {puzzle.grids.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                  {puzzle.grids.map((grid, index) => (
                    <button
                      key={grid.id}
                      onClick={() => {
                        const nextId = selectedGridId === grid.id ? null : grid.id;
                        setSelectedGridId(nextId);
                        if (nextId) setSelectionMode("grid");
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group active:scale-[0.98] ${selectedGridId === grid.id
                          ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-xl"
                          : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700"
                        }`}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex flex-col items-start translate-x-0 group-hover:translate-x-1 transition-transform">
                          <span className="text-sm font-black uppercase tracking-widest">
                            Grid {index + 1}
                          </span>
                        </div>
                      </div>
                      {puzzle.grids.length > 1 && (
                        <div 
                          className={`p-1.5 rounded-lg border-2 transition-all hover:bg-rose-500 hover:border-rose-500 hover:text-white ${selectedGridId === grid.id ? "border-white/20 bg-white/10" : "border-zinc-100 dark:border-zinc-800"}`}
                          title="Remove this grid from the board"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGrid(grid.id);
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {selectionMode === "grid" ? (
                  <button
                    onClick={() => {
                      setIsAddingGrid(!isAddingGrid);
                      if (!isAddingGrid) setSelectedGridId(null);
                    }}
                    title="Anchor a new 9x9 Sudoku grid into the world."
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all border-2 flex items-center justify-center gap-2 shadow-sm active:scale-95 ${isAddingGrid
                        ? "bg-teal-500 text-white border-teal-500 animate-pulse"
                        : "bg-zinc-50 text-zinc-900 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-500"
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {isAddingGrid ? "CLICK BOARD TO PLACE" : "ADD NEW GRID"}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 flex flex-col items-center text-center gap-2">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] font-medium text-zinc-500 max-w-[160px]">
                      New grids can only be added in <strong>Grid Mode</strong>.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Reset Workspace */}
              <div className="pt-6 mt-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to reset the entire workspace? All grids and digits will be lost.")) {
                      setSelectedGridId(null);
                      setPuzzle(createEmptyPuzzle());
                    }
                  }}
                  title="Clear all grids and reset to a single blank 9x9 Sudoku."
                  className="w-full py-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 active:scale-95 transition-all text-red-600 dark:text-red-400 text-[10px] font-black tracking-widest uppercase flex flex-col items-center justify-center gap-1.5 shadow-sm border border-red-200 dark:border-red-500/20"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  RESET WORKSPACE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clues Tab */}
        {activeTab === "Clues" && (
          <div className="space-y-6 flex flex-col h-full">
             <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0 -mx-6 mb-4 overflow-x-auto no-scrollbar">
                {CLUE_SUBTABS.map((subtab) => (
                  <button
                    key={subtab}
                    onClick={() => setActiveClueSubtab(subtab)}
                    className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeClueSubtab === subtab
                        ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                        : "border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                  >
                    {subtab}
                  </button>
                ))}
             </div>

             <div className="flex-1 space-y-6 animate-in fade-in duration-300">
                {activeClueSubtab === "region" && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Region Clues</h4>
                     
                     <button
                        disabled={!selectedGridId}
                        onClick={toggleWindoku}
                        title={!selectedGridId ? "Select a grid first." : (isWindokuActive ? "Remove Windoku constraint" : "Add Windoku constraint")}
                        className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${isWindokuActive 
                          ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30" 
                          : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                        } ${!selectedGridId ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"}`}
                      >
                         <div className="flex-1 space-y-1">
                            <span className={`text-xs font-bold uppercase tracking-widest block ${isWindokuActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-300"}`}>Windoku</span>
                            <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                               Adds 4 independent 3x3 regions to the selected grid that must contain 1-9 uniquely.
                            </span>
                         </div>
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${isWindokuActive ? "bg-indigo-100 text-indigo-500 dark:bg-indigo-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                            {isWindokuActive ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <div className="grid grid-cols-2 gap-0.5 opacity-60">
                                <div className="w-2 h-2 bg-current rounded-sm"></div>
                                <div className="w-2 h-2 bg-current rounded-sm"></div>
                                <div className="w-2 h-2 bg-current rounded-sm"></div>
                                <div className="w-2 h-2 bg-current rounded-sm"></div>
                              </div>
                            )}
                         </div>
                      </button>

                     <div className="space-y-2 mt-4">
                       <button
                          disabled={!selectedGridId}
                          onClick={toggleAsterisk}
                          title={!selectedGridId ? "Select a grid first." : (isAsteriskActive ? "Remove Asterisk constraint" : "Add Asterisk constraint")}
                          className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${isAsteriskActive 
                            ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30" 
                            : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                          } ${!selectedGridId ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"}`}
                        >
                           <div className="flex-1 space-y-1">
                              <span className={`text-xs font-bold uppercase tracking-widest block ${isAsteriskActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-300"}`}>Asterisk</span>
                              <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                 Specific 9 shaded cells in a star pattern must contain 1-9 uniquely.
                              </span>
                           </div>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${isAsteriskActive ? "bg-amber-100 text-amber-500 dark:bg-amber-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                              {isAsteriskActive ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4m12 5.657l-8-11.314m0 11.314l8-11.314" /></svg>
                              ) : (
                                <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4m12 5.657l-8-11.314m0 11.314l8-11.314" /></svg>
                              )}
                           </div>
                        </button>

                       <button
                          disabled={!selectedGridId}
                          onClick={toggleCenterDots}
                          title={!selectedGridId ? "Select a grid first." : (isCenterDotsActive ? "Remove Center Dots constraint" : "Add Center Dots constraint")}
                          className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${isCenterDotsActive 
                            ? "bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/30" 
                            : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                          } ${!selectedGridId ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"}`}
                        >
                           <div className="flex-1 space-y-1">
                              <span className={`text-xs font-bold uppercase tracking-widest block ${isCenterDotsActive ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-zinc-600 dark:text-zinc-300"}`}>Center Dots</span>
                              <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                 The center cell of all nine 3x3 boxes form a valid set of 1-9.
                              </span>
                           </div>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${isCenterDotsActive ? "bg-fuchsia-100 text-fuchsia-500 dark:bg-fuchsia-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                              {isCenterDotsActive ? (
                                <div className="grid grid-cols-3 gap-0.5">
                                  {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-current rounded-full"></div>)}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-0.5 opacity-60">
                                  {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-current rounded-full"></div>)}
                                </div>
                              )}
                           </div>
                        </button>
                     </div>

                     <div className="p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4 mt-4">
                        <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM9 4v16m6-16v16M4 9h16M4 15h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[150px]">Custom Jigsaw and Killer Region tools will appear here.</p>
                     </div>
                  </div>
                )}
                {activeClueSubtab === "adjacent" && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Adjacent Clues</h4>
                     <div className="grid grid-cols-2 gap-3">
                        {(["X", "V"] as const).map((type) => (
                           <button
                              key={type}
                              onClick={() => {
                                 if (activeClueType === type) {
                                    setActiveClueType(null);
                                    setActiveClueSubType(null);
                                    setClueSelectionFirst(null);
                                 } else {
                                    setActiveClueType(type);
                                    setActiveClueSubType(null);
                                    setClueSelectionFirst(null);
                                 }
                              }}
                              className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === type
                                 ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                 : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                              }`}
                           >
                              <span className="text-xl font-black">{type}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest">{type === "X" ? "Sum 10" : "Sum 5"}</span>
                           </button>
                        ))}
                        {([
                            { subType: "white", label: "White Dot", desc: "Consecutive" },
                            { subType: "black", label: "Black Dot", desc: "Ratio 1:2" }
                        ] as const).map((k) => (
                           <button
                              key={k.subType}
                              onClick={() => {
                                 if (activeClueType === "Kropki" && activeClueSubType === k.subType) {
                                    setActiveClueType(null);
                                    setActiveClueSubType(null);
                                    setClueSelectionFirst(null);
                                 } else {
                                    setActiveClueType("Kropki");
                                    setActiveClueSubType(k.subType);
                                    setClueSelectionFirst(null);
                                 }
                              }}
                              className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === "Kropki" && activeClueSubType === k.subType
                                 ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                 : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                              }`}
                           >
                              <div className={`w-8 h-8 rounded-full shadow-sm border ${k.subType === "black" 
                                ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white" 
                                : "bg-white border-zinc-400 dark:bg-zinc-50 dark:border-zinc-600"}`} 
                              />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-center">{k.label}</span>
                           </button>
                        ))}
                        {([
                            { subType: ">", label: "Greater Than", icon: ">" },
                            { subType: "<", label: "Less Than", icon: "<" }
                        ] as const).map((ik) => (
                           <button
                              key={ik.subType}
                              onClick={() => {
                                 if (activeClueType === "Inequality" && activeClueSubType === ik.subType) {
                                    setActiveClueType(null);
                                    setActiveClueSubType(null);
                                    setClueSelectionFirst(null);
                                 } else {
                                    setActiveClueType("Inequality");
                                    setActiveClueSubType(ik.subType);
                                    setClueSelectionFirst(null);
                                 }
                              }}
                              className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === "Inequality" && activeClueSubType === ik.subType
                                 ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                 : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                              }`}
                           >
                              <span className="text-xl font-black">{ik.icon}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-center">{ik.label}</span>
                           </button>
                        ))}
                     </div>
                      <div className="pt-2">
                         <button
                            onClick={() => {
                               setPuzzle(prev => ({ ...prev, allXVGiven: !prev.allXVGiven }));
                            }}
                            className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${puzzle.allXVGiven 
                              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" 
                              : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                            } active:scale-[0.98]`}
                         >
                            <div className="flex-1 space-y-1">
                               <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.allXVGiven ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}`}>All XV Given</span>
                               <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                  Negative constraint: If no clue is present, adjacent cells CANNOT sum to 5 or 10.
                               </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.allXVGiven ? "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                               <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${puzzle.allXVGiven ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-600"}`}>
                                 {puzzle.allXVGiven && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                               </div>
                            </div>
                         </button>
                         
                         <button
                            onClick={() => {
                               setPuzzle(prev => ({ ...prev, allKropkiGiven: !prev.allKropkiGiven }));
                            }}
                            className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all mt-2 ${puzzle.allKropkiGiven 
                              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" 
                              : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                            } active:scale-[0.98]`}
                         >
                            <div className="flex-1 space-y-1">
                               <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.allKropkiGiven ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}`}>All Kropki Given</span>
                               <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                  Negative constraint: If no dot is present, adjacent cells cannot be consecutive or have a 1:2 ratio.
                               </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.allKropkiGiven ? "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                               <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${puzzle.allKropkiGiven ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-600"}`}>
                                 {puzzle.allKropkiGiven && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                               </div>
                            </div>
                         </button>
                      </div>

                      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed px-1 italic">
                        Select a clue type, then click two adjacent cells on the board to place the clue.
                      </p>
                  </div>
                )}
                {activeClueSubtab === "outside" && (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Outside Clues</h4>
                     </div>

                     <div className="grid grid-cols-1 gap-3">
                        <button
                           onClick={() => {
                              if (activeClueType === "Sandwich") {
                                 setActiveClueType(null);
                              } else {
                                 setActiveClueType("Sandwich");
                              }
                           }}
                           className={`p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${activeClueType === "Sandwich"
                              ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                              : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                           }`}
                        >
                           <div className="flex-1 space-y-1">
                              <span className="text-xs font-bold uppercase tracking-widest block">Sandwich Clue</span>
                              <span className="text-[10px] font-medium opacity-80 leading-snug block">
                                 The sum of digits between 1 and 9 in a row or column.
                              </span>
                           </div>
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-transparent transition-all flex-shrink-0 ml-3 ${activeClueType === "Sandwich" ? "bg-white/10 dark:bg-black/10" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>
                              </svg>
                           </div>
                        </button>
                     </div>

                     <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl transition-all border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed px-1">
                           {activeClueType === "Sandwich" 
                             ? "Click on the highlighted areas outside the grids to place a Sandwich clue with the chosen sum."
                             : "Select a clue type to begin building outside constraints."}
                        </p>
                     </div>
                  </div>
                )}
                {activeClueSubtab === "global" && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Global Constraints</h4>
                     
                     <div className="space-y-2">
                        <button
                           onClick={() => setPuzzle(prev => ({ ...prev, antiknight: !prev.antiknight }))}
                           className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${puzzle.antiknight 
                             ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30" 
                             : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                           } active:scale-[0.98]`}
                         >
                            <div className="flex-1 space-y-1">
                               <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.antiknight ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-300"}`}>Anti-Knight</span>
                               <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                  No two identical digits can be a knight's move apart.
                               </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.antiknight ? "bg-indigo-100 text-indigo-500 dark:bg-indigo-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                               <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4l-4 4-4 4m0 0l4 4 4 4M8 12h12" /></svg>
                            </div>
                         </button>

                         <button
                           onClick={() => setPuzzle(prev => ({ ...prev, antiking: !prev.antiking }))}
                           className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${puzzle.antiking 
                             ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30" 
                             : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                           } active:scale-[0.98]`}
                         >
                            <div className="flex-1 space-y-1">
                               <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.antiking ? "text-rose-600 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-300"}`}>Anti-King</span>
                               <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                  No two identical digits can be a king's move apart.
                               </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.antiking ? "bg-rose-100 text-rose-500 dark:bg-rose-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                               <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 13L19 19M5 5L11 11M19 5L13 11M5 19L11 13M12 3V21M3 12H21" /></svg>
                            </div>
                         </button>

                         <button
                           onClick={() => setPuzzle(prev => ({ ...prev, nonConsecutive: !prev.nonConsecutive }))}
                           className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${puzzle.nonConsecutive 
                             ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30" 
                             : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                           } active:scale-[0.98]`}
                         >
                            <div className="flex-1 space-y-1">
                               <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.nonConsecutive ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-300"}`}>Non-Consecutive</span>
                               <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                  Orthogonally adjacent cells CANNOT contain consecutive digits.
                               </span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.nonConsecutive ? "bg-amber-100 text-amber-500 dark:bg-amber-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                               <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                         </button>
                     </div>

                     <div className="p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4 mt-4">
                        <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8V12L15 15" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/><circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[150px]">Global constraints apply to every cell on every grid.</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Description Tab Contents */}
        {activeTab === "Description" && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
             <div className="space-y-4 px-1">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Puzzle Title</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-[12px] border border-zinc-100 dark:border-zinc-800 transition-all focus:border-zinc-900 dark:focus:border-zinc-50 outline-none font-bold"
                    placeholder="Give your puzzle a name..."
                    value={puzzle.title || ""}
                    onChange={(e) => setPuzzle(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Primary Author</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-[12px] border border-zinc-100 dark:border-zinc-800 transition-all focus:border-zinc-900 dark:focus:border-zinc-50 outline-none"
                    placeholder="Your name or alias"
                    value={puzzle.author || ""}
                    onChange={(e) => setPuzzle(p => ({ ...p, author: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Story & Notes</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-[12px] border border-zinc-100 dark:border-zinc-800 transition-all focus:border-zinc-900 dark:focus:border-zinc-50 outline-none min-h-[80px] resize-none leading-relaxed"
                    placeholder="Thematic lore or designer notes..."
                    value={puzzle.description || ""}
                    onChange={(e) => setPuzzle(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Rules (Markdown)</label>
                     {puzzle.customRules && (
                       <button 
                         onClick={() => setPuzzle(p => ({ ...p, customRules: undefined }))}
                         className="text-[9px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest"
                       >
                         Reset to Auto
                       </button>
                     )}
                  </div>
                  
                  <textarea 
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-[11px] border border-zinc-100 dark:border-zinc-800 transition-all focus:border-zinc-900 dark:focus:border-zinc-50 outline-none min-h-[140px] resize-none leading-relaxed custom-scrollbar font-mono text-zinc-400 focus:text-zinc-900 dark:focus:text-zinc-100 placeholder:text-zinc-400"
                    placeholder="Custom rules... (leave blank to autogenerate)"
                    value={puzzle.customRules || ""}
                    onChange={(e) => setPuzzle(p => ({ ...p, customRules: e.target.value }))}
                  />
                  
                  {!puzzle.customRules && (
                    <div className="mt-4 p-4 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
                       <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Autogenerated Preview:</span>
                       <div className="text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap italic opacity-80">
                          {generateAutoRules(puzzle)}
                       </div>
                    </div>
                  )}
                </div>

             </div>
          </div>
        )}

      </div>

      {/* Validity Feedback Modal */}
      {validationResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 flex flex-col items-center gap-6 ${validationResult.valid ? "bg-emerald-500/5" : "bg-rose-500/5"}`}>
              <div className={`p-4 rounded-full ${validationResult.valid ? "bg-emerald-500" : "bg-rose-500"} shadow-lg shadow-zinc-950/20`}>
                {validationResult.valid ? (
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                  {validationResult.valid ? "VALID PUZZLE" : validationResult.message.toUpperCase()}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium px-4">
                  {validationResult.valid 
                    ? "The Python script confirms that all digits follow multisudoku rules." 
                    : "The Python script detected one or more issues."}
                </p>
              </div>

              {validationResult.details && (
                <div className="w-full max-h-[120px] overflow-y-auto p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                   <pre className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-tight">
                      {validationResult.details}
                   </pre>
                </div>
              )}

              <button 
                onClick={() => setValidationResult(null)}
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-zinc-950/10"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uniqueness Feedback Modal */}
      {uniqueResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 flex flex-col items-center gap-6 ${uniqueResult.status === "unique" ? "bg-teal-500/5" : "bg-amber-500/5"}`}>
              <div className={`p-4 rounded-full ${uniqueResult.status === "unique" ? "bg-teal-500" : "bg-amber-500"} shadow-lg shadow-zinc-950/20`}>
                {uniqueResult.status === "unique" ? (
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                  {uniqueResult.status.replace('_', ' ').toUpperCase()} RESULT
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium px-4">
                  {uniqueResult.message}
                </p>
              </div>

              {uniqueResult.details && (
                <div className="w-full max-h-[120px] overflow-y-auto p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                   <pre className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap leading-tight">
                      {uniqueResult.details}
                   </pre>
                </div>
              )}

              <button 
                onClick={() => setUniqueResult(null)}
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-zinc-950/10"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
