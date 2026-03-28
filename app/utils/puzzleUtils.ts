import { PuzzleDef, CellData, Region, Position } from "../types/puzzle";

export function createDefault9x9Puzzle(): PuzzleDef {
  const cells: Record<string, CellData> = {};
  const regions: Region[] = [];

  // Initialize cells
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells[`${r},${c}`] = {
        val: null,
        isGiven: false,
      };
    }
  }

  // Initialize standard 3x3 regions
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {
      const regionCells: Position[] = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          regionCells.push({ r: boxR * 3 + i, c: boxC * 3 + j });
        }
      }
      regions.push({ cells: regionCells });
    }
  }

  return {
    cells,
    regions,
  };
}
