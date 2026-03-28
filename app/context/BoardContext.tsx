"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PuzzleDef } from "../types/puzzle";
import { createDefault9x9Puzzle } from "../utils/puzzleUtils";

interface BoardContextType {
  isMarkerActive: boolean;
  setIsMarkerActive: (val: boolean) => void;
  puzzle: PuzzleDef;
  setPuzzle: (puzzle: PuzzleDef | ((prev: PuzzleDef) => PuzzleDef)) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [isMarkerActive, setIsMarkerActive] = useState(false);
  const [puzzle, setPuzzle] = useState<PuzzleDef>(createDefault9x9Puzzle());

  return (
    <BoardContext.Provider value={{ isMarkerActive, setIsMarkerActive, puzzle, setPuzzle }}>
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
