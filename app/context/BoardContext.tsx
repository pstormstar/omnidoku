"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PuzzleDef, GridDef, GRID_SIZE } from "../types/puzzle";
import { createEmptyPuzzle, mergeGridIntoPuzzle } from "../utils/puzzleUtils";

export type GameMode = "design" | "play";

interface BoardContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  isMarkerActive: boolean;
  selectedGridId: string | null;
  setSelectedGridId: (id: string | null) => void;
  isAddingGrid: boolean;
  setIsAddingGrid: (val: boolean) => void;
  placementPivot: { r: number; c: number } | null;
  setPlacementPivot: (pos: { r: number; c: number } | null) => void;
  addGrid: (r: number, c: number, pivotR: number, pivotC: number, dr: number, dc: number) => void;
  moveGrid: (gridId: string, dr: number, dc: number) => void;
  removeGrid: (gridId: string) => void;
  selectionMode: "grid" | "cell";
  setSelectionMode: (mode: "grid" | "cell") => void;
  puzzle: PuzzleDef;
  setPuzzle: (puzzle: PuzzleDef | ((prev: PuzzleDef) => PuzzleDef)) => void;
  activeClueType: "X" | "V" | "Kropki" | "Inequality" | "Sandwich" | "Quadruple" | null;
  setActiveClueType: (type: "X" | "V" | "Kropki" | "Inequality" | "Sandwich" | "Quadruple" | null) => void;
  activeClueSubType: "black" | "white" | ">" | "<" | string | null;
  setActiveClueSubType: (subType: "black" | "white" | ">" | "<" | string | null) => void;
  clueSelectionFirst: { r: number; c: number } | null;
  setClueSelectionFirst: (pos: { r: number; c: number } | null) => void;
  removeAdjacentClue: (pos1: { r: number; c: number }, pos2: { r: number; c: number }) => void;
  removeSandwich: (row?: number, col?: number) => void;
  sandwichSum: number;
  setSandwichSum: (sum: number) => void;
  isPublishSidebarOpen: boolean;
  setIsPublishSidebarOpen: (val: boolean) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [gameMode, setGameModeState] = useState<GameMode>("design");
  const [puzzle, setPuzzle] = useState<PuzzleDef>(createEmptyPuzzle());
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [isAddingGrid, setIsAddingGrid] = useState(false);
  const [placementPivot, setPlacementPivot] = useState<{ r: number; c: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState<"grid" | "cell">("cell");
  const [activeClueType, setActiveClueType] = useState<"X" | "V" | "Kropki" | "Inequality" | "Sandwich" | null>(null);
  const [activeClueSubType, setActiveClueSubType] = useState<"black" | "white" | ">" | "<" | null>(null);
  const [clueSelectionFirst, setClueSelectionFirst] = useState<{ r: number; c: number } | null>(null);
  const [sandwichSum, setSandwichSum] = useState<number>(0);
  const [isPublishSidebarOpen, setIsPublishSidebarOpen] = useState(false);

  const setGameMode = (mode: GameMode) => {
    setGameModeState(mode);
    if (mode === "play") setSelectionMode("cell");
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
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
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

  const addGrid = (r: number, c: number, pivotR: number, pivotC: number, dr: number, dc: number) => {
    const nextIdNum = puzzle.grids.length + 1;
    const nextId = `g${nextIdNum}`;

    const newGrid: GridDef = {
      id: nextId,
      r,
      c,
      pivotR,
      pivotC,
      dr,
      dc
    };
    setPuzzle(prev => mergeGridIntoPuzzle(prev, newGrid));
    setSelectedGridId(newGrid.id);
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

  const removeAdjacentClue = (pos1: { r: number; c: number }, pos2: { r: number; c: number }) => {
    setPuzzle(prev => {
      const nextClues = (prev.adjacentClues || []).filter(clue => {
        const same1 = (clue.pos1.r === pos1.r && clue.pos1.c === pos1.c && clue.pos2.r === pos2.r && clue.pos2.c === pos2.c);
        const same2 = (clue.pos1.r === pos2.r && clue.pos1.c === pos2.c && clue.pos2.r === pos1.r && clue.pos2.c === pos1.c);
        return !(same1 || same2);
      });
      return { ...prev, adjacentClues: nextClues };
    });
  };

  const removeSandwich = (row?: number, col?: number) => {
    setPuzzle(prev => {
      const nextSandwiches = (prev.sandwiches || []).filter(s => {
        if (row !== undefined) return s.row !== row;
        if (col !== undefined) return s.col !== col;
        return true;
      });
      return { ...prev, sandwiches: nextSandwiches };
    });
  };

  const isMarkerActive = gameMode === "design";

  return (
    <BoardContext.Provider value={{ 
      gameMode, setGameMode, isMarkerActive, 
      selectedGridId, setSelectedGridId,
      isAddingGrid, setIsAddingGrid,
      placementPivot, setPlacementPivot,
      addGrid, moveGrid, removeGrid,
      selectionMode, setSelectionMode,
      puzzle, setPuzzle,
      activeClueType, setActiveClueType,
      activeClueSubType, setActiveClueSubType,
      clueSelectionFirst, setClueSelectionFirst,
      removeAdjacentClue, removeSandwich,
      sandwichSum, setSandwichSum,
      isPublishSidebarOpen, setIsPublishSidebarOpen
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
