"use client";

import { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { useBoard } from "../context/BoardContext";
import { GRID_SIZE } from "../types/puzzle";

export default function SudokuBoard() {
  const { 
    isMarkerActive, puzzle, setPuzzle,
    isAddingGrid, addGrid, selectedGridId, setSelectedGridId,
    placementPivot, setPlacementPivot, moveGrid,
    selectionMode, setSelectionMode, gameMode,
    activeClueType, setActiveClueType,
    activeClueSubType, setActiveClueSubType,
    clueSelectionFirst, setClueSelectionFirst,
    removeAdjacentClue,
    sandwichSum, setSandwichSum, removeSandwich
  } = useBoard();
  const cellSize = 55;
  const [transform, setTransform] = useState({ 
    x: -(GRID_SIZE * cellSize) / 2, 
    y: -(GRID_SIZE * cellSize) / 2, 
    scale: 1 
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ r: number; c: number } | null>(null);
  const [hoveredSandwichIdx, setHoveredSandwichIdx] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  let minR = 0, maxR = GRID_SIZE - 1, minC = 0, maxC = GRID_SIZE - 1;
  const cellKeys = Object.keys(puzzle.cells);
  if (cellKeys.length > 0 || puzzle.grids.length > 0) {
    minR = Infinity; maxR = -Infinity; minC = Infinity; maxC = -Infinity;
    
    // Include all cells
    cellKeys.forEach(k => {
      const [rStr, cStr] = k.split(",");
      const r = parseInt(rStr, 10), c = parseInt(cStr, 10);
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    });

    // Also include all grid bounds in case some grids are empty
    puzzle.grids.forEach(g => {
      if (g.r < minR) minR = g.r; if (g.r + GRID_SIZE - 1 > maxR) maxR = g.r + GRID_SIZE - 1;
      if (g.c < minC) minC = g.c; if (g.c + GRID_SIZE - 1 > maxC) maxC = g.c + GRID_SIZE - 1;
    });
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCell(null);
        setSelectedGridId(null);
        setPlacementPivot(null);
        setActiveClueType(null);
        setClueSelectionFirst(null);
        return;
      }
      if (selectionMode === "cell" && selectedCell) {
        const { r, c } = selectedCell;
        const key = `${r},${c}`;
        const currentCell = puzzle.cells[key];
        if (e.key === "ArrowUp") { e.preventDefault(); setSelectedCell({ r: r - 1, c }); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedCell({ r: r + 1, c }); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); setSelectedCell({ r, c: c - 1 }); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); setSelectedCell({ r, c: c + 1 }); return; }
        if (currentCell && (!currentCell.isGiven || isMarkerActive)) {
          const num = parseInt(e.key);
          let finalNum: number | null = null;
          if (!isNaN(num) && num >= 1 && num <= 9) {
            finalNum = num;
          }
          if (finalNum !== null) {
            setPuzzle(prev => ({ ...prev, cells: { ...prev.cells, [key]: { ...currentCell, val: finalNum, isGiven: isMarkerActive } } }));
          } else if (e.key === "Backspace" || e.key === "Delete") {
            setPuzzle(prev => ({ ...prev, cells: { ...prev.cells, [key]: { ...currentCell, val: null, isGiven: false } } }));
          }
        }
      } else if (selectionMode === "grid" && selectedGridId) {
        if (e.key === "ArrowUp") { e.preventDefault(); moveGrid(selectedGridId, -1, 0); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); moveGrid(selectedGridId, 1, 0); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); moveGrid(selectedGridId, 0, -1); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); moveGrid(selectedGridId, 0, 1); return; }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedCell, isMarkerActive, puzzle.cells, setPuzzle, selectedGridId, moveGrid, selectionMode, setPlacementPivot, setActiveClueType, setClueSelectionFirst]);

  const handleMouseMove = (e: any) => {
    if (isPanning) {
      setTransform((prev) => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (selectionMode === "grid" && isDraggingGrid && dragStartRef.current && selectedGridId) {
      const dx = (e.clientX - dragStartRef.current.x) / transform.scale;
      const dy = (e.clientY - dragStartRef.current.y) / transform.scale;
      const dr = Math.round(dy / cellSize);
      const dc = Math.round(dx / cellSize);
      if (dr !== 0 || dc !== 0) {
        moveGrid(selectedGridId, dr, dc);
        dragStartRef.current.x += dc * cellSize * transform.scale;
        dragStartRef.current.y += dr * cellSize * transform.scale;
      }
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(transform.scale * scaleFactor, 0.1), 10);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;
      setTransform({ x: mouseX - worldX * newScale, y: mouseY - worldY * newScale, scale: newScale });
    }
  };

  const handleCellClick = (r: number, c: number, e: MouseEvent) => {
    e.stopPropagation();
    if (activeClueType) {
      if (!clueSelectionFirst) {
        setClueSelectionFirst({ r, c });
      } else {
        const isAdjacent = (Math.abs(r - clueSelectionFirst.r) === 1 && c === clueSelectionFirst.c) ||
                           (Math.abs(c - clueSelectionFirst.c) === 1 && r === clueSelectionFirst.r);
        if (isAdjacent) {
          setPuzzle(prev => {
            const nextClues = [...(prev.adjacentClues || [])];
            // Prevent duplicates
            const exists = nextClues.some(clue => 
              (clue.pos1.r === clueSelectionFirst.r && clue.pos1.c === clueSelectionFirst.c && clue.pos2.r === r && clue.pos2.c === c) ||
              (clue.pos1.r === r && clue.pos1.c === c && clue.pos2.r === clueSelectionFirst.r && clue.pos2.c === clueSelectionFirst.c)
            );
            if (!exists && activeClueType !== "Sandwich") {
              nextClues.push({ 
                type: activeClueType as any, 
                pos1: clueSelectionFirst, 
                pos2: { r, c },
                subType: activeClueType === "Kropki" ? activeClueSubType || "white" : 
                         activeClueType === "Inequality" ? activeClueSubType || ">" : undefined
              });
            }
            return { ...prev, adjacentClues: nextClues };
          });
          // Keep activeClueType for multi-placement, but reset first cell
          setClueSelectionFirst(null);
        } else {
          setClueSelectionFirst({ r, c });
        }
      }
    } else if (selectionMode === "grid") {
      if (isAddingGrid) {
        if (!placementPivot) { setPlacementPivot({ r, c }); }
        else {
          const dr = r - placementPivot.r, dc = c - placementPivot.c;
          if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
            const startR = dr === -1 ? placementPivot.r - GRID_SIZE + 1 : placementPivot.r;
            const startC = dc === -1 ? placementPivot.c - GRID_SIZE + 1 : placementPivot.c;
            addGrid(startR, startC, placementPivot.r, placementPivot.c, dr, dc);
            setPlacementPivot(null);
          } else { setPlacementPivot(r === placementPivot.r && c === placementPivot.c ? null : { r, c }); }
        }
      } else {
        const grid = puzzle.grids.find(g => r >= g.r && r < g.r + GRID_SIZE && c >= g.c && c < g.c + GRID_SIZE);
        if (grid) setSelectedGridId(grid.id);
      }
    } else { setSelectedCell({ r, c }); }
  };

  const buffer = 10;
  const boardWidth = (maxC - minC + 1) * cellSize + buffer;
  const boardHeight = (maxR - minR + 1) * cellSize + buffer;
  
  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.button === 0 && setIsPanning(true)}
      onMouseMove={handleMouseMove}
      onMouseUp={() => { setIsPanning(false); setIsDraggingGrid(false); dragStartRef.current = null; }}
      onMouseLeave={() => { setIsPanning(false); setIsDraggingGrid(false); dragStartRef.current = null; }}
      onWheel={handleWheel}
      onClick={() => { setSelectedCell(null); setSelectedGridId(null); setPlacementPivot(null); setActiveClueType(null); setClueSelectionFirst(null); }}
      className={`relative w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 cursor-${isPanning ? "grabbing" : "grab"}`}
    >
      {isAddingGrid && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 rounded-2xl bg-zinc-900/90 dark:bg-zinc-50/90 text-white dark:text-zinc-900 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 border border-zinc-500/20 flex items-center gap-3 select-none pointer-events-none">
           <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
           {!placementPivot ? "Step 1: Select a corner cell" : "Step 2: Select an arrow"}
        </div>
      )}

      {activeClueType && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 rounded-2xl bg-zinc-900/90 dark:bg-zinc-50/90 text-white dark:text-zinc-900 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 border border-zinc-500/20 flex items-center gap-3 select-none pointer-events-none">
           <div className={`w-2 h-2 rounded-full animate-pulse ${
             activeClueType === "X" ? "bg-amber-500" : 
             activeClueType === "V" ? "bg-fuchsia-500" : 
             activeClueType === "Inequality" ? "bg-zinc-900 border-2 border-zinc-200 dark:bg-zinc-100" :
             activeClueSubType === "black" ? "bg-zinc-950 dark:bg-white" : "bg-white border border-zinc-900 dark:bg-zinc-100"
           }`} />
           {!clueSelectionFirst ? `Select first cell for ${activeClueType} ${activeClueSubType || ""}` : `Select adjacent cell to place ${activeClueType} ${activeClueSubType || ""}`}
        </div>
      )}
      
      {/* Floating Selection Mode Toggle */}
      {gameMode === "design" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 pointer-events-auto">
          <div 
             className="absolute h-[calc(100%-12px)] top-[6px] bg-zinc-900 dark:bg-zinc-700 rounded-xl transition-all duration-300 shadow-sm"
             style={{ 
               width: 'calc(50% - 6px)', 
               left: selectionMode === "grid" ? 'calc(50% + 3px)' : '6px' 
             }}
          />
          {(["cell", "grid"] as const).map((mode) => (
            <button
              key={mode}
              onClick={(e) => { e.stopPropagation(); setSelectionMode(mode); }}
              title={mode === "grid" ? "Grid Mode: Move and configure boards." : "Cell Mode: Focus on digit entry and cell navigation."}
              className={`flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all z-10 ${selectionMode === mode
                  ? "text-white dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
            >
              {mode} Mode
            </button>
          ))}
        </div>
      )}

      <div
        className="absolute"
        style={{ 
          left: "50%", top: "50%", transformOrigin: "0 0",
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` 
        }}
      >
        <svg 
          id="omnidoku-puzzle-svg"
          width={boardWidth} height={boardHeight} className="overflow-visible" 
          viewBox={`${minC * cellSize - buffer/2} ${minR * cellSize - buffer/2} ${boardWidth} ${boardHeight}`}
          style={{ position: 'absolute', left: `${minC * cellSize - buffer/2}px`, top: `${minR * cellSize - buffer/2}px`, vectorEffect: 'non-scaling-stroke' }}
        >
          <g>
            {Object.entries(puzzle.cells).map(([key, cell]: [string, any]) => {
              const [rStr, cStr] = key.split(",");
              const r = parseInt(rStr, 10), c = parseInt(cStr, 10);
              const x = c * cellSize, y = r * cellSize;
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              return (
                <rect
                  key={`bg-${key}`} x={x} y={y} width={cellSize} height={cellSize}
                  fill={isSelected ? "rgba(161, 161, 170, 0.3)" : cell.color || "transparent"}
                  className={`transition-colors ${selectionMode === "cell" ? "cursor-pointer hover:fill-zinc-400/10" : ""}`}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onMouseEnter={() => {
                    if (isAddingGrid && placementPivot) {
                      const dr = r - placementPivot.r, dc = c - placementPivot.c;
                      if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
                        const startR = dr === -1 ? placementPivot.r - GRID_SIZE + 1 : placementPivot.r;
                        const startC = dc === -1 ? placementPivot.c - GRID_SIZE + 1 : placementPivot.c;
                        setGhostPos({ r: startR, c: startC });
                      } else setGhostPos(null);
                    }
                  }}
                  onMouseLeave={() => setGhostPos(null)}
                />
              );
            })}
            {activeClueType && clueSelectionFirst && (
               <rect 
                  x={clueSelectionFirst.c * cellSize} y={clueSelectionFirst.r * cellSize} 
                  width={cellSize} height={cellSize} 
                  fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={3} 
                  className="pointer-events-none stroke-dasharray-[4,4]"
               />
            )}
            {isAddingGrid && ghostPos && (
              <rect x={ghostPos.c * cellSize} y={ghostPos.r * cellSize} width={GRID_SIZE * cellSize} height={GRID_SIZE * cellSize} fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" className="pointer-events-none animate-pulse" />
            )}
            {isAddingGrid && placementPivot && (
              <g>
                <rect x={placementPivot.c * cellSize} y={placementPivot.r * cellSize} width={cellSize} height={cellSize} fill="none" stroke="#ef4444" strokeWidth={4} className="pointer-events-none" />
                {[-1, 1].map(dr => [-1, 1].map(dc => {
                  const x = (placementPivot.c + dc) * cellSize, y = (placementPivot.r + dr) * cellSize;
                  return (
                    <g 
                      key={`${dr}-${dc}`} 
                      className="cursor-pointer group/arrow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const startR = dr === -1 ? placementPivot.r - GRID_SIZE + 1 : placementPivot.r;
                        const startC = dc === -1 ? placementPivot.c - GRID_SIZE + 1 : placementPivot.c;
                        addGrid(startR, startC, placementPivot.r, placementPivot.c, dr, dc);
                        setPlacementPivot(null);
                      }}
                      onMouseEnter={() => {
                        const startR = dr === -1 ? placementPivot.r - GRID_SIZE + 1 : placementPivot.r;
                        const startC = dc === -1 ? placementPivot.c - GRID_SIZE + 1 : placementPivot.c;
                        setGhostPos({ r: startR, c: startC });
                      }}
                      onMouseLeave={() => setGhostPos(null)}
                    >
                      {/* Invisible hit target for better ergonomics */}
                      <rect x={x} y={y} width={cellSize} height={cellSize} fill="transparent" />
                      <path 
                        d={`M ${x + cellSize / 2 - dc * 10} ${y + cellSize / 2 - dr * 10} L ${x + cellSize / 2 + dc * 10} ${y + cellSize / 2 + dr * 10} M ${x + cellSize / 2 + dc * 10 - dc * 5 + dr * 5} ${y + cellSize / 2 + dr * 10 - dr * 5 - dc * 5} L ${x + cellSize / 2 + dc * 10} ${y + cellSize / 2 + dr * 10} L ${x + cellSize / 2 + dc * 10 - dc * 5 - dr * 5} ${y + cellSize / 2 + dr * 10 - dr * 5 + dc * 5}`} 
                        stroke="#ef4444" 
                        strokeWidth={4} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none"
                        className="animate-arrow-pivot group-hover/arrow:stroke-teal-500 transition-colors"
                        style={{ "--move-dx": dc, "--move-dy": dr } as React.CSSProperties}
                      />
                    </g>
                  );
                }))}
              </g>
            )}
            {Object.entries(puzzle.cells).map(([key]) => {
              const [rStr, cStr] = key.split(",");
              const r = parseInt(rStr, 10), c = parseInt(cStr, 10);
              return <rect key={`line-${key}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="none" stroke="currentColor" strokeWidth={0.5} className="text-zinc-200 dark:text-zinc-800 pointer-events-none" />;
            })}
            {puzzle.regions.map((region: any, idx: number) => {
              const lines: any[] = [];
              const isWindoku = region.id?.startsWith("windoku-");
              const isDiagonal = region.id?.startsWith("diagonal-");
              
              if (isDiagonal) {
                 if (region.cells.length > 0) {
                      const first = region.cells[0];
                      const last = region.cells[region.cells.length - 1];
                      
                      const x1 = first.c * cellSize + cellSize / 2;
                      const y1 = first.r * cellSize + cellSize / 2;
                      const x2 = last.c * cellSize + cellSize / 2;
                      const y2 = last.r * cellSize + cellSize / 2;
                      
                      lines.push(
                          <line 
                             key={`diag-${idx}`} 
                             x1={x1} y1={y1} x2={x2} y2={y2} 
                             stroke="currentColor" 
                             strokeWidth={6} 
                             strokeDasharray="2 12"
                             strokeLinecap="round"
                             className="text-rose-500/40 dark:text-rose-400/40" 
                          />
                      );
                 }
                 return <g key={`region-${idx}`} className="pointer-events-none">{lines}</g>;
              }
              
              const cellSet = new Set(region.cells.map((p: any) => `${p.r},${p.c}`));
              
              region.cells.forEach((p: any) => {
                const x = p.c * cellSize, y = p.r * cellSize;
                
                if (isWindoku) {
                   lines.push(<rect key={`wbg-${p.r}-${p.c}`} x={x} y={y} width={cellSize} height={cellSize} className="fill-indigo-500/10 dark:fill-indigo-400/10 pointer-events-none" />);
                }
                
                if (!cellSet.has(`${p.r - 1},${p.c}`)) lines.push(<line key={`t-${p.r}-${p.c}`} x1={x} y1={y} x2={x + cellSize} y2={y} stroke="currentColor" strokeWidth={isWindoku ? 1.5 : 2.5} className={isWindoku ? "text-indigo-400/50" : "text-zinc-900 dark:text-zinc-100"} />);
                if (!cellSet.has(`${p.r + 1},${p.c}`)) lines.push(<line key={`b-${p.r}-${p.c}`} x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} stroke="currentColor" strokeWidth={isWindoku ? 1.5 : 2.5} className={isWindoku ? "text-indigo-400/50" : "text-zinc-900 dark:text-zinc-100"} />);
                if (!cellSet.has(`${p.r},${p.c - 1}`)) lines.push(<line key={`l-${p.r}-${p.c}`} x1={x} y1={y} x2={x} y2={y + cellSize} stroke="currentColor" strokeWidth={isWindoku ? 1.5 : 2.5} className={isWindoku ? "text-indigo-400/50" : "text-zinc-900 dark:text-zinc-100"} />);
                if (!cellSet.has(`${p.r},${p.c + 1}`)) lines.push(<line key={`r-${p.r}-${p.c}`} x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} stroke="currentColor" strokeWidth={isWindoku ? 1.5 : 2.5} className={isWindoku ? "text-indigo-400/50" : "text-zinc-900 dark:text-zinc-100"} />);
              });
              return <g key={`region-${idx}`} className="pointer-events-none">{lines}</g>;
            })}

            {/* Grid Outer Borders */}
            {puzzle.grids.map((g) => (
              <rect
                key={`outer-${g.id}`}
                x={g.c * cellSize}
                y={g.r * cellSize}
                width={GRID_SIZE * cellSize}
                height={GRID_SIZE * cellSize}
                fill="none"
                stroke="currentColor"
                strokeWidth={5}
                className="text-zinc-900 dark:text-zinc-100 pointer-events-none"
              />
            ))}
            {selectedGridId && selectionMode === "grid" && puzzle.grids.find(g => g.id === selectedGridId) && (() => {
              const g = puzzle.grids.find(grid => grid.id === selectedGridId)!;
              return (
                <rect
                  x={g.c * cellSize} y={g.r * cellSize} width={GRID_SIZE * cellSize} height={GRID_SIZE * cellSize}
                  fill="rgba(20, 184, 166, 0.05)" stroke="#14b8a6" strokeWidth={4} strokeDasharray="10 5" className="cursor-move"
                  onMouseDown={(e) => { e.stopPropagation(); setIsDraggingGrid(true); dragStartRef.current = { x: e.clientX, y: e.clientY }; }}
                />
              );
            })()}
            {Object.entries(puzzle.cells).map(([key, cell]: [string, any]) => {
              if (cell.val === null) return null;
              const [rStr, cStr] = key.split(",");
              const r = parseInt(rStr, 10), c = parseInt(cStr, 10);
              const x = c * cellSize + cellSize / 2, y = r * cellSize + cellSize / 2;
              return <text key={`text-${key}`} x={x} y={y} dominantBaseline="central" textAnchor="middle" className={`fill-zinc-900 dark:fill-zinc-50 select-none pointer-events-none transition-all ${cell.isGiven ? "font-extrabold" : "font-normal"}`} style={{ fontSize: cell.isGiven ? "2.4rem" : "1.8rem" }}>{cell.val}</text>;
            })}

            {puzzle.sandwiches?.map((sandwich, idx) => {
              const x = sandwich.c * cellSize + cellSize / 2;
              const y = sandwich.r * cellSize + cellSize / 2;
              const isHovered = hoveredSandwichIdx === idx && gameMode === "design";
              return (
                <g 
                  key={`sandwich-${idx}`} 
                  className={gameMode === "design" ? "cursor-default select-none" : "pointer-events-none"}
                  onMouseEnter={() => setHoveredSandwichIdx(idx)}
                  onMouseLeave={() => setHoveredSandwichIdx(null)}
                >
                  <rect 
                    x={sandwich.c * cellSize + 4} y={sandwich.r * cellSize + 4} 
                    width={cellSize - 8} height={cellSize - 8} 
                    className={`transition-all rounded-lg stroke-zinc-900/10 dark:stroke-zinc-50/10 ${isHovered ? "fill-zinc-200 dark:fill-zinc-700 shadow-md" : "fill-zinc-100 dark:fill-zinc-800"}`}
                    strokeWidth={1}
                  />
                  <text 
                    x={x} y={y} dominantBaseline="central" textAnchor="middle" 
                    className="fill-zinc-900 dark:fill-zinc-100 font-extrabold text-[16px]"
                  >
                    {sandwich.sum}
                  </text>
                  {isHovered && (
                     <g 
                       className="cursor-pointer group"
                       onClick={(e) => {
                         e.stopPropagation();
                         setPuzzle(prev => ({
                           ...prev, 
                           sandwiches: prev.sandwiches?.filter((_, i) => i !== idx)
                         }));
                         setHoveredSandwichIdx(null);
                       }}
                     >
                        <circle cx={sandwich.c * cellSize + cellSize - 8} cy={sandwich.r * cellSize + 8} r={8} className="fill-rose-500 hover:fill-rose-600 transition-colors" />
                        <text 
                          x={sandwich.c * cellSize + cellSize - 8} y={sandwich.r * cellSize + 8} 
                          dominantBaseline="central" textAnchor="middle" 
                          className="fill-white font-black text-[10px]"
                        >
                           ×
                        </text>
                     </g>
                  )}
                </g>
              );
            })}

            {/* Sandwich Placement Slots */}
            {activeClueType === "Sandwich" && (() => {
               const slots: { r: number, c: number }[] = [];
               puzzle.grids.forEach(g => {
                 for (let i = 0; i < 9; i++) {
                   // Top, Bottom, Left, Right
                   slots.push({ r: g.r - 1, c: g.c + i });
                   slots.push({ r: g.r + 9, c: g.c + i });
                   slots.push({ r: g.r + i, c: g.c - 1 });
                   slots.push({ r: g.r + i, c: g.c + 9 });
                 }
               });
               // Deduplicate slots
               const uniqueSlots = Array.from(new Set(slots.map(s => `${s.r},${s.c}`))).map(k => {
                 const [r, c] = k.split(",").map(Number);
                 return { r, c };
               });

               return uniqueSlots.map((s, idx) => (
                 <rect 
                   key={`sandwich-slot-${idx}`}
                   x={s.c * cellSize + 8} y={s.r * cellSize + 8} 
                   width={cellSize - 16} height={cellSize - 16} 
                   className="fill-teal-500/20 stroke-teal-500/50 cursor-crosshair hover:fill-teal-500/40 animate-pulse" 
                   strokeWidth={2} strokeDasharray="4 2"
                   onClick={(e) => {
                     e.stopPropagation();
                     const existing = puzzle.sandwiches?.find(ex => ex.r === s.r && ex.c === s.c);
                     const input = prompt("Enter Sandwich Sum (0-45):", existing ? String(existing.sum) : "0");
                     if (input === null) return;
                     const val = parseInt(input);
                     if (isNaN(val)) return;

                     setPuzzle(prev => {
                       const nextSandwiches = [...(prev.sandwiches || [])];
                       // Check if slot is a row or column of at least one grid
                       const grid = puzzle.grids.find(g => 
                         (s.r === g.r - 1 && s.c >= g.c && s.c < g.c + 9) || 
                         (s.r === g.r + 9 && s.c >= g.c && s.c < g.c + 9) || 
                         (s.c === g.c - 1 && s.r >= g.r && s.r < g.r + 9) || 
                         (s.c === g.c + 9 && s.r >= g.r && s.r < g.r + 9)
                       );
                       if (!grid) return prev;
                       const row = (s.c === grid.c - 1 || s.c === grid.c + 9) ? s.r : undefined;
                       const col = (s.r === grid.r - 1 || s.r === grid.r + 9) ? s.c : undefined;

                       const existsIdx = nextSandwiches.findIndex(ex => ex.r === s.r && ex.c === s.c);
                       if (existsIdx !== -1) {
                         nextSandwiches[existsIdx].sum = val;
                       } else {
                         nextSandwiches.push({ 
                            sum: val, 
                            r: s.r, 
                            c: s.c, 
                            row, 
                            col,
                            gridId: grid.id
                         });
                       }
                       return { ...prev, sandwiches: nextSandwiches };
                     });
                   }}
                 />
               ));
            })()}

            {puzzle.adjacentClues?.map((clue, idx) => {
              const x1 = clue.pos1.c * cellSize + cellSize / 2;
              const y1 = clue.pos1.r * cellSize + cellSize / 2;
              const x2 = clue.pos2.c * cellSize + cellSize / 2;
              const y2 = clue.pos2.r * cellSize + cellSize / 2;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const midX = x1 + dx / 2;
              const midY = y1 + dy / 2;
              
              const isKropki = clue.type === "Kropki";
              const isBlack = clue.subType === "black";
              const isInequality = clue.type === "Inequality";
              
              const clickProps = {
                onClick: (e: any) => {
                  if (gameMode === "design") {
                    e.stopPropagation();
                    removeAdjacentClue(clue.pos1, clue.pos2);
                  }
                },
                className: `select-none ${gameMode === "design" ? "cursor-pointer" : "pointer-events-none"}`
              };

              if (isInequality) {
                const isGreater = clue.subType === ">";
                const vdr = clue.pos2.r - clue.pos1.r;
                const vdc = clue.pos2.c - clue.pos1.c;
                let angle = Math.atan2(vdr, vdc) * (180 / Math.PI);
                if (!isGreater) angle += 180;

                return (
                  <g key={`adj-clue-${idx}`} transform={`translate(${midX}, ${midY}) rotate(${angle})`} {...clickProps}>
                    <path 
                      d="M -5 -7 L 4 0 L -5 7" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={2.5} 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="text-zinc-900 dark:text-zinc-100"
                    />
                  </g>
                );
              }
              
              return (
                <g key={`adj-clue-${idx}`} {...clickProps}>
                  <circle 
                    cx={midX} cy={midY} r={isKropki ? 8 : 12}
                    fill={isKropki ? (isBlack ? "#000" : "#fff") : "#fff"}
                    stroke={isKropki ? (isBlack ? "#000" : "#000") : "currentColor"}
                    strokeWidth={1}
                    className={!isKropki ? "dark:fill-zinc-900 text-zinc-200 dark:text-zinc-800 shadow-sm" : ""}
                  />
                  {!isKropki && (
                    <text 
                      x={midX} y={midY} dominantBaseline="central" textAnchor="middle" 
                      className="fill-zinc-900 dark:fill-zinc-100 font-black text-[14px]"
                    >
                      {clue.type}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
