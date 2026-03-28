"use client";

import { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { useBoard } from "../context/BoardContext";

export default function SudokuBoard() {
  const { isMarkerActive, puzzle, setPuzzle } = useBoard();
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute bounding box
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  const cellKeys = Object.keys(puzzle.cells);
  if (cellKeys.length === 0) {
    minR = maxR = minC = maxC = 0;
  } else {
    cellKeys.forEach(k => {
      const [rStr, cStr] = k.split(",");
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      
      const { r, c } = selectedCell;
      const key = `${r},${c}`;
      const currentCell = puzzle.cells[key];
      
      // Navigation
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCell({ r: r - 1 < minR ? maxR : r - 1, c }); // Wrap around or clamp
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCell({ r: r + 1 > maxR ? minR : r + 1, c });
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedCell({ r, c: c - 1 < minC ? maxC : c - 1 });
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedCell({ r, c: c + 1 > maxC ? minC : c + 1 });
        return;
      }

      if (!currentCell) return;

      if (!isMarkerActive && currentCell.isGiven) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        setPuzzle(prev => ({
          ...prev,
          cells: {
             ...prev.cells,
             [key]: { ...currentCell, val: num, isGiven: isMarkerActive }
          }
        }));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        setPuzzle(prev => ({
          ...prev,
          cells: {
             ...prev.cells,
             [key]: { ...currentCell, val: null, isGiven: false }
          }
        }));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedCell, isMarkerActive, puzzle.cells, minR, maxR, minC, maxC, setPuzzle]);

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isPanning) return;
    setTransform((prev) => ({
      ...prev,
      x: prev.x + e.movementX,
      y: prev.y + e.movementY,
    }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });
  };

  const handleWheel = (e: WheelEvent) => {
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * scaleFactor, 0.2), 5),
    }));
  };

  const cellSize = 55;
  const width = (maxC - minC + 1) * cellSize;
  const height = (maxR - minR + 1) * cellSize;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 cursor-${
        isPanning ? "grabbing" : "grab"
      }`}
    >
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center",
            transition: isPanning ? "none" : "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)",
          }}
          className="flex items-center justify-center pointer-events-none"
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white dark:bg-zinc-900 rounded-sm pointer-events-auto"
          >
            {/* Draw active cells backgrounds */}
            {Object.entries(puzzle.cells).map(([key, cell]) => {
              const [rStr, cStr] = key.split(",");
              const r = parseInt(rStr, 10);
              const c = parseInt(cStr, 10);
              const x = (c - minC) * cellSize;
              const y = (r - minR) * cellSize;
              
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;

              return (
                <rect
                  key={`bg-${key}`}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={isSelected ? "rgba(161, 161, 170, 0.3)" : cell.color || "transparent"}
                  className="cursor-pointer hover:fill-zinc-400/10 transition-colors"
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })}

            {/* Minor grid lines out of the active cells */}
            {Object.entries(puzzle.cells).map(([key]) => {
              const [rStr, cStr] = key.split(",");
              const r = parseInt(rStr, 10);
              const c = parseInt(cStr, 10);
              const x = (c - minC) * cellSize;
              const y = (r - minR) * cellSize;
              return (
                <rect
                  key={`border-${key}`}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  className="text-zinc-200 dark:text-zinc-800 pointer-events-none"
                />
              );
            })}

            {/* Calculate and draw region borders */}
            {puzzle.regions.map((region, idx) => {
              const lines = [];
              const cellSet = new Set(region.cells.map(p => `${p.r},${p.c}`));
              
              region.cells.forEach(p => {
                const x = (p.c - minC) * cellSize;
                const y = (p.r - minR) * cellSize;

                if (!cellSet.has(`${p.r - 1},${p.c}`)) {
                  lines.push(<line key={`t-${p.r}-${p.c}`} x1={x} y1={y} x2={x + cellSize} y2={y} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                }
                if (!cellSet.has(`${p.r + 1},${p.c}`)) {
                  lines.push(<line key={`b-${p.r}-${p.c}`} x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                }
                if (!cellSet.has(`${p.r},${p.c - 1}`)) {
                  lines.push(<line key={`l-${p.r}-${p.c}`} x1={x} y1={y} x2={x} y2={y + cellSize} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                }
                if (!cellSet.has(`${p.r},${p.c + 1}`)) {
                  lines.push(<line key={`r-${p.r}-${p.c}`} x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} stroke="currentColor" strokeWidth={2.5} className="text-zinc-900 dark:text-zinc-100" />);
                }
              });

              return <g key={`region-${idx}`} className="pointer-events-none">{lines}</g>;
            })}

            {/* Draw Numbers */}
            {Object.entries(puzzle.cells).map(([key, cell]) => {
              if (cell.val === null) return null;
              const [rStr, cStr] = key.split(",");
              const r = parseInt(rStr, 10);
              const c = parseInt(cStr, 10);
              const x = (c - minC) * cellSize + cellSize / 2;
              const y = (r - minR) * cellSize + cellSize / 2;

              return (
                <text
                  key={`text-${key}`}
                  x={x}
                  y={y}
                  dominantBaseline="central"
                  textAnchor="middle"
                  className={`fill-zinc-900 dark:fill-zinc-50 select-none pointer-events-none transition-all ${
                    cell.isGiven ? "font-extrabold" : "font-normal"
                  }`}
                  style={{ fontSize: cell.isGiven ? "2.4rem" : "1.8rem" }}
                >
                  {cell.val}
                </text>
              );
            })}

            {/* Active Cursor */}
            {selectedCell && (
              <rect
                x={(selectedCell.c - minC) * cellSize}
                y={(selectedCell.r - minR) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 2"
                className="pointer-events-none animate-pulse"
                style={{ transition: isPanning ? "none" : "all 0.15s ease-out" }}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Control overlay */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 p-2 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg pointer-events-auto">
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 5) }))}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.2) }))}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      </div>
      
      <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/10 dark:bg-zinc-50/10 rounded-full backdrop-blur-md border border-white/20 pointer-events-none transition-opacity opacity-50 hover:opacity-100">
        <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
          Drag to Move • Scroll to Zoom
        </p>
      </div>
    </div>
  );
}
