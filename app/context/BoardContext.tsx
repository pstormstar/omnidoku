"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PuzzleDef, GridDef } from "../types/puzzle";
import { createEmptyPuzzle, mergeGridIntoPuzzle, getBoxGeometry } from "../utils/puzzleUtils";

export type GameMode = "design" | "play";

interface BoardContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  isMarkerActive: boolean;
  gridSize: number;
  setGridSize: (size: number) => void;
  selectedGridId: string | null;
  setSelectedGridId: (id: string | null) => void;
  isAddingGrid: boolean;
  setIsAddingGrid: (val: boolean) => void;
  placementPivot: { r: number; c: number } | null;
  setPlacementPivot: (pos: { r: number; c: number } | null) => void;
  addGrid: (r: number, c: number, size: number, pivotR: number, pivotC: number, dr: number, dc: number) => void;
  moveGrid: (gridId: string, dr: number, dc: number) => void;
  removeGrid: (gridId: string) => void;
  setJigsawMode: (gridId: string, val: boolean) => void;
  selectionMode: "grid" | "cell";
  setSelectionMode: (mode: "grid" | "cell") => void;
  puzzle: PuzzleDef;
  setPuzzle: (puzzle: PuzzleDef | ((prev: PuzzleDef) => PuzzleDef)) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [gameMode, setGameModeState] = useState<GameMode>("design");
  const [gridSize, setGridSizeState] = useState(9);
  const [puzzle, setPuzzle] = useState<PuzzleDef>(createEmptyPuzzle(9));
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [isAddingGrid, setIsAddingGrid] = useState(false);
  const [placementPivot, setPlacementPivot] = useState<{ r: number; c: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState<"grid" | "cell">("cell");

  const setGameMode = (mode: GameMode) => {
    setGameModeState(mode);
    if (mode === "play") setSelectionMode("cell");
  };

  const setGridSize = (size: number) => {
    setGridSizeState(size);
    if (selectedGridId) {
      setPuzzle(prev => {
        const grid = prev.grids.find(g => g.id === selectedGridId);
        if (!grid) return prev;
        
        const newR = grid.dr === 1 ? grid.pivotR : grid.pivotR - size + 1;
        const newC = grid.dc === 1 ? grid.pivotC : grid.pivotC - size + 1;

        const { boxW, boxH } = getBoxGeometry(size);
        const standardSizes = [4, 6, 8, 9, 10, 12, 15, 16];
        const isSizeStandard = standardSizes.includes(size);

        const newGrid: GridDef = { 
          ...grid, 
          size, 
          r: newR, 
          c: newC,
          boxW,
          boxH,
          isJigsaw: !isSizeStandard
        };
        
        let newPuzzle: PuzzleDef = { ...prev, grids: prev.grids.map(g => g.id === selectedGridId ? newGrid : g), cells: {}, regions: [] };
        newPuzzle.grids.forEach(g => {
          newPuzzle = mergeGridIntoPuzzle(newPuzzle, g);
        });
        return newPuzzle;
      });
    } else {
      setGridSizeState(size);
      setPuzzle(createEmptyPuzzle(size));
    }
  };

  const moveGrid = (gridId: string, dr: number, dc: number) => {
    setPuzzle(prev => {
      const grid = prev.grids.find(g => g.id === gridId);
      if (!grid) return prev;
      
      const newGrid: GridDef = { 
        ...grid, 
        r: grid.r + dr, 
        c: grid.c + dc,
        pivotR: grid.pivotR + dr,
        pivotC: grid.pivotC + dc
      };
      
      const newCells = { ...prev.cells };
      const gridKeys = [];
      for (let r = 0; r < grid.size; r++) {
        for (let c = 0; c < grid.size; c++) {
           gridKeys.push(`${grid.r + r},${grid.c + c}`);
        }
      }

      const dataToMove: Record<string, any> = {};
      gridKeys.forEach(key => {
        if (newCells[key]) {
          dataToMove[key] = newCells[key];
          delete newCells[key];
        }
      });

      Object.entries(dataToMove).forEach(([key, data]) => {
        const [r, c] = key.split(",").map(Number);
        newCells[`${r + dr},${c + dc}`] = data;
      });

      let nextPuzzle: PuzzleDef = { ...prev, grids: prev.grids.map(g => g.id === gridId ? newGrid : g), cells: newCells, regions: [] };
      nextPuzzle.grids.forEach(g => {
        nextPuzzle = mergeGridIntoPuzzle(nextPuzzle, g);
      });
      return nextPuzzle;
    });
  };

  const addGrid = (r: number, c: number, size: number, pivotR: number, pivotC: number, dr: number, dc: number) => {
    const { boxW, boxH } = getBoxGeometry(size);
    const standardSizes = [4, 6, 8, 9, 10, 12, 15, 16];
    const isJigsaw = !standardSizes.includes(size);
    setPuzzle(prev => {
      const existingIds = prev.grids.map(g => parseInt(g.id.replace('g', '')) || 0);
      const nextIdNum = Math.max(0, ...existingIds) + 1;
      const nextId = `g${nextIdNum}`;

      const newGrid: GridDef = {
        id: nextId,
        r,
        c,
        size,
        boxW,
        boxH,
        pivotR,
        pivotC,
        dr,
        dc,
        isJigsaw
      };

      const nextPuzzle = mergeGridIntoPuzzle(prev, newGrid);
      setSelectedGridId(nextId);
      return nextPuzzle;
    });
    setIsAddingGrid(false);
  };

  const removeGrid = (gridId: string) => {
    setPuzzle(prev => {
      if (prev.grids.length <= 1) return prev;
      const nextGrids = prev.grids.filter(g => g.id !== gridId);
      let nextPuzzle: PuzzleDef = { ...prev, grids: nextGrids, cells: {}, regions: [] };
      nextGrids.forEach(g => {
        nextPuzzle = mergeGridIntoPuzzle(nextPuzzle, g);
      });
      return nextPuzzle;
    });
    if (selectedGridId === gridId) setSelectedGridId(null);
  };

  const setJigsawMode = (gridId: string, val: boolean) => {
    setPuzzle(prev => {
      const grid = prev.grids.find(g => g.id === gridId);
      if (!grid) return prev;
      const newGrid = { ...grid, isJigsaw: val };
      let newPuzzle: PuzzleDef = { ...prev, grids: prev.grids.map(g => g.id === gridId ? newGrid : g), cells: prev.cells, regions: [] };
      newPuzzle.grids.forEach(g => {
        newPuzzle = mergeGridIntoPuzzle(newPuzzle, g);
      });
      return newPuzzle;
    });
  };

  const isMarkerActive = gameMode === "design";

  return (
    <BoardContext.Provider value={{ 
      gameMode, setGameMode, isMarkerActive, 
      gridSize, setGridSize, 
      selectedGridId, setSelectedGridId,
      isAddingGrid, setIsAddingGrid,
      placementPivot, setPlacementPivot,
      addGrid, moveGrid, removeGrid, setJigsawMode,
      selectionMode, setSelectionMode,
      puzzle, setPuzzle 
    }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}
