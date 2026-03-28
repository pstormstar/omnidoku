"use client";

import { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { useBoard } from "../context/BoardContext";

export default function SudokuBoard() {
  const { 
    isMarkerActive, puzzle, setPuzzle, gridSize,
    isAddingGrid, addGrid, selectedGridId, setSelectedGridId,
    placementPivot, setPlacementPivot, moveGrid,
    selectionMode
  } = useBoard();
  const cellSize = 55;
  const [transform, setTransform] = useState({ 
    x: -(gridSize * cellSize) / 2, 
    y: -(gridSize * cellSize) / 2, 
    scale: 1 
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ r: number; c: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  let minR = 0, maxR = 9, minC = 0, maxC = 9;
  const cellKeys = Object.keys(puzzle.cells);
  if (cellKeys.length > 0) {
    minR = Infinity; maxR = -Infinity; minC = Infinity; maxC = -Infinity;
    cellKeys.forEach(k => {
      const [rStr, cStr] = k.split(",");
      const r = parseInt(rStr, 10), c = parseInt(cStr, 10);
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    });
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCell(null);
        setSelectedGridId(null);
        setPlacementPivot(null);
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
          const letters: Record<string, number> = { a: 10, b: 11, c: 12, d: 13, e: 14, f: 15, g: 16 };
          let finalNum: number | null = null;
          if (!isNaN(num)) {
            if (gridSize > 9 && currentCell.val === 1 && num <= (gridSize - 10)) finalNum = 10 + num;
            else if (num > 0) finalNum = num;
            else if (num === 0) finalNum = 10;
          } else if (letters[e.key.toLowerCase()]) finalNum = letters[e.key.toLowerCase()];
          if (finalNum !== null && finalNum >= 1 && finalNum <= gridSize) {
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
  }, [selectedCell, isMarkerActive, puzzle.cells, setPuzzle, selectedGridId, moveGrid, gridSize, selectionMode, setPlacementPivot]);

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
    if (selectionMode === "grid") {
      if (isAddingGrid) {
        if (!placementPivot) { setPlacementPivot({ r, c }); }
        else {
          const dr = r - placementPivot.r, dc = c - placementPivot.c;
          if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
            const startR = dr === -1 ? placementPivot.r - gridSize + 1 : placementPivot.r;
            const startC = dc === -1 ? placementPivot.c - gridSize + 1 : placementPivot.c;
            addGrid(startR, startC, gridSize, placementPivot.r, placementPivot.c, dr, dc);
            setPlacementPivot(null);
          } else { setPlacementPivot(r === placementPivot.r && c === placementPivot.c ? null : { r, c }); }
        }
      } else {
        const grid = puzzle.grids.find(g => r >= g.r && r < g.r + g.size && c >= g.c && c < g.c + g.size);
        if (grid) setSelectedGridId(grid.id);
      }
    } else { setSelectedCell({ r, c }); }
  };

  const boardWidth = (maxC - minC + 1) * cellSize;
  const boardHeight = (maxR - minR + 1) * cellSize;

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.button === 0 && setIsPanning(true)}
      onMouseMove={handleMouseMove}
      onMouseUp={() => { setIsPanning(false); setIsDraggingGrid(false); dragStartRef.current = null; }}
      onMouseLeave={() => { setIsPanning(false); setIsDraggingGrid(false); dragStartRef.current = null; }}
      onWheel={handleWheel}
      onClick={() => { setSelectedCell(null); setSelectedGridId(null); setPlacementPivot(null); }}
      className={`relative w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 cursor-${isPanning ? "grabbing" : "grab"}`}
    >
      {isAddingGrid && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 rounded-2xl bg-zinc-900/90 dark:bg-zinc-50/90 text-white dark:text-zinc-900 text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 border border-zinc-500/20 flex items-center gap-3 select-none pointer-events-none">
           <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
           {!placementPivot ? "Step 1: Select a corner cell" : "Step 2: Select an arrow"}
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
          width={boardWidth} height={boardHeight} className="overflow-visible" 
          viewBox={`${minC * cellSize} ${minR * cellSize} ${boardWidth} ${boardHeight}`}
          style={{ position: 'absolute', left: `${minC * cellSize}px`, top: `${minR * cellSize}px`, vectorEffect: 'non-scaling-stroke' }}
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
                        const startR = dr === -1 ? placementPivot.r - gridSize + 1 : placementPivot.r;
                        const startC = dc === -1 ? placementPivot.c - gridSize + 1 : placementPivot.c;
                        setGhostPos({ r: startR, c: startC });
                      } else setGhostPos(null);
                    }
                  }}
                  onMouseLeave={() => setGhostPos(null)}
                />
              );
            })}
            {isAddingGrid && ghostPos && (
              <rect x={ghostPos.c * cellSize} y={ghostPos.r * cellSize} width={gridSize * cellSize} height={gridSize * cellSize} fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" className="pointer-events-none animate-pulse" />
            )}
            {isAddingGrid && placementPivot && (
              <g className="pointer-events-none">
                <rect x={placementPivot.c * cellSize} y={placementPivot.r * cellSize} width={cellSize} height={cellSize} fill="none" stroke="#ef4444" strokeWidth={4} />
                {[-1, 1].map(dr => [-1, 1].map(dc => {
                  const x = (placementPivot.c + dc) * cellSize, y = (placementPivot.r + dr) * cellSize;
                  return (
                    <g key={`${dr}-${dc}`}>
                      <path 
                        d={`M ${x + cellSize / 2 - dc * 10} ${y + cellSize / 2 - dr * 10} L ${x + cellSize / 2 + dc * 10} ${y + cellSize / 2 + dr * 10} M ${x + cellSize / 2 + dc * 10 - dc * 5 + dr * 5} ${y + cellSize / 2 + dr * 10 - dr * 5 - dc * 5} L ${x + cellSize / 2 + dc * 10} ${y + cellSize / 2 + dr * 10} L ${x + cellSize / 2 + dc * 10 - dc * 5 - dr * 5} ${y + cellSize / 2 + dr * 10 - dr * 5 + dc * 5}`} 
                        stroke="#ef4444" 
                        strokeWidth={4} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none"
                        className="animate-arrow-pivot"
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
              const cellSet = new Set(region.cells.map((p: any) => `${p.r},${p.c}`));
              region.cells.forEach((p: any) => {
                const x = p.c * cellSize, y = p.r * cellSize;
                if (!cellSet.has(`${p.r - 1},${p.c}`)) lines.push(<line key={`t-${p.r}-${p.c}`} x1={x} y1={y} x2={x + cellSize} y2={y} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                if (!cellSet.has(`${p.r + 1},${p.c}`)) lines.push(<line key={`b-${p.r}-${p.c}`} x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                if (!cellSet.has(`${p.r},${p.c - 1}`)) lines.push(<line key={`l-${p.r}-${p.c}`} x1={x} y1={y} x2={x} y2={y + cellSize} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                if (!cellSet.has(`${p.r},${p.c + 1}`)) lines.push(<line key={`r-${p.r}-${p.c}`} x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
              });
              return <g key={`region-${idx}`} className="pointer-events-none">{lines}</g>;
            })}

            {/* Grid Outer Borders */}
            {puzzle.grids.map((g) => (
              <rect
                key={`outer-${g.id}`}
                x={g.c * cellSize}
                y={g.r * cellSize}
                width={g.size * cellSize}
                height={g.size * cellSize}
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
                  x={g.c * cellSize} y={g.r * cellSize} width={g.size * cellSize} height={g.size * cellSize}
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
              return <text key={`text-${key}`} x={x} y={y} dominantBaseline="central" textAnchor="middle" className={`fill-zinc-900 dark:fill-zinc-50 select-none pointer-events-none transition-all ${cell.isGiven ? "font-extrabold" : "font-normal"}`} style={{ fontSize: (cell.val && cell.val > 9) ? (cell.isGiven ? "1.9rem" : "1.4rem") : (cell.isGiven ? "2.4rem" : "1.8rem") }}>{cell.val}</text>;
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
