"use client";

import { useState, useRef } from "react";
import { useBoard } from "../context/BoardContext";

const TABS = ["General", "Clues", "Support"] as const;
type Tab = (typeof TABS)[number];

const CLUE_SUBTABS = ["region", "adjacent", "outside", "global"] as const;
type ClueSubtab = (typeof CLUE_SUBTABS)[number];

const STANDARD_SIZES = [4, 6, 8, 9, 10, 12, 15, 16];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [activeClueSubtab, setActiveClueSubtab] = useState<ClueSubtab>("region");
  
  const {
    gameMode, gridSize, setGridSize,
    puzzle, selectedGridId, setSelectedGridId,
    isAddingGrid, setIsAddingGrid,
    selectionMode, setSelectionMode,
    removeGrid
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

  if (isPlayMode) {
    return (
      <aside className="w-10 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-center relative overflow-hidden group hover:w-48 transition-all duration-500">
        <div className="whitespace-nowrap -rotate-90 origin-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:rotate-0 transition-transform duration-500">
          DESIGN MODE REQUIRED FOR SIDEBAR
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={sidebarRef}
      style={{ width: isMinimized ? "64px" : `${width}%` }}
      className={`flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50 hidden md:flex flex-col relative ${isDragging ? "" : "transition-[width] duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)"
        }`}
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

              {/* Selection Mode Toggle */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl relative">
                <div 
                   className="absolute h-8 bg-white dark:bg-zinc-700 rounded-lg transition-all duration-300 shadow-sm"
                   style={{ 
                     width: 'calc(50% - 4px)', 
                     left: selectionMode === "grid" ? 'calc(50% + 2px)' : '2px' 
                   }}
                />
                {(["cell", "grid"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectionMode(mode)}
                    title={mode === "grid" ? "Grid Mode: Move and configure boards." : "Cell Mode: Focus on digit entry and cell navigation."}
                    className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all z-10 ${selectionMode === mode
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400"
                      }`}
                  >
                    {mode} Mode
                  </button>
                ))}
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
                  {puzzle.grids.map((grid) => (
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
                            {grid.size}x{grid.size}
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
                    title="Anchor a new Sudoku grid into the world."
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

              {selectedGridId && selectionMode === "grid" && (
                <div className="space-y-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4 px-1">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Select Board Size
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                         {STANDARD_SIZES.map(size => (
                           <button
                             key={size}
                             onClick={() => setGridSize(size)}
                             className={`py-3 rounded-lg text-xs font-black transition-all ${gridSize === size 
                               ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-105" 
                               : "bg-zinc-50 text-zinc-500 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 hover:border-zinc-300"}`}
                           >
                             {size}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                     <div className="p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4">
                        <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM9 4v16m6-16v16M4 9h16M4 15h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[150px]">Custom Jigsaw and Killer Region tools will appear here.</p>
                     </div>
                  </div>
                )}
                {activeClueSubtab === "adjacent" && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Adjacent Clues</h4>
                     <div className="p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4">
                        <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7h8M8 12h8m-8 5h8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[150px]">Kropki Dots, XV Clues, and White/Black dots will appear here.</p>
                     </div>
                  </div>
                )}
                {activeClueSubtab === "outside" && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Outside Clues</h4>
                     <div className="p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4">
                        <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[150px]">Sandwich Sudoku and Little Killer Arrow tools will appear here.</p>
                     </div>
                  </div>
                )}
                {activeClueSubtab === "global" && (
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Global Constraints</h4>
                     <div className="p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center gap-4">
                        <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed max-w-[150px]">Anti-King, Anti-Knight, and Non-Consecutive constraints.</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === "Support" && (
          <div className="space-y-4">
            {["User Guide", "Keyboard Shortcuts", "API References"].map((item) => (
              <a key={item} href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <span className="text-sm">{item}</span>
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
              </a>
            ))}
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
