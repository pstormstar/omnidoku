import { PuzzleDef, CellData, Region, Position, GridDef } from "../types/puzzle";

export function getBoxGeometry(size: number): { boxW: number; boxH: number } {
  if (size === 4) return { boxW: 2, boxH: 2 };
  if (size === 6) return { boxW: 3, boxH: 2 };
  if (size === 8) return { boxW: 4, boxH: 2 };
  if (size === 9) return { boxW: 3, boxH: 3 };
  if (size === 10) return { boxW: 5, boxH: 2 };
  if (size === 12) return { boxW: 4, boxH: 3 };
  if (size === 15) return { boxW: 5, boxH: 3 };
  if (size === 16) return { boxW: 4, boxH: 4 };
  return { boxW: size, boxH: size }; // Generic for others (Jigsaw)
}

export function createEmptyPuzzle(size: number): PuzzleDef {
  const { boxW, boxH } = getBoxGeometry(size);
  const initialGrid: GridDef = {
    id: "g1",
    r: 0,
    c: 0,
    size,
    boxW,
    boxH,
    pivotR: 0,
    pivotC: 0,
    dr: 1,
    dc: 1
  };

  return mergeGridIntoPuzzle({ grids: [], cells: {}, regions: [] }, initialGrid);
}

export function mergeGridIntoPuzzle(puzzle: PuzzleDef, grid: GridDef): PuzzleDef {
  const newCells = { ...puzzle.cells };
  const newRegions = [...puzzle.regions];

  // Add cells
  for (let dr = 0; dr < grid.size; dr++) {
    for (let dc = 0; dc < grid.size; dc++) {
      const r = grid.r + dr;
      const c = grid.c + dc;
      const key = `${r},${c}`;
      if (!newCells[key]) {
        newCells[key] = { val: null, isGiven: false };
      }
    }
  }

  // Add regions ONLY if NOT jigsaw AND size is standard
  const standardSizes = [4, 6, 8, 9, 10, 12, 15, 16];
  if (!grid.isJigsaw && standardSizes.includes(grid.size)) {
    for (let boxR = 0; boxR < grid.size / grid.boxH; boxR++) {
      for (let boxC = 0; boxC < grid.size / grid.boxW; boxC++) {
        const regionCells: Position[] = [];
        for (let i = 0; i < grid.boxH; i++) {
          for (let j = 0; j < grid.boxW; j++) {
            regionCells.push({ r: grid.r + boxR * grid.boxH + i, c: grid.c + boxC * grid.boxW + j });
          }
        }
        newRegions.push({ 
          id: `box-${grid.id}-${boxR}_${boxC}`,
          type: 'box',
          cells: regionCells, 
          gridId: grid.id 
        });
      }
    }
  }

  const alreadyExists = puzzle.grids.some(g => g.id === grid.id);
  const nextGrids = alreadyExists 
    ? puzzle.grids.map(g => g.id === grid.id ? grid : g)
    : [...puzzle.grids, grid];

  return {
    ...puzzle,
    cells: newCells,
    regions: newRegions,
    grids: nextGrids
  };
}
