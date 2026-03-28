import { PuzzleDef, CellData, Region, Position, GridDef, GRID_SIZE, BOX_W, BOX_H } from "../types/puzzle";

export function createEmptyPuzzle(): PuzzleDef {
  const initialGrid: GridDef = {
    id: "g1",
    r: 0,
    c: 0,
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

  // Add cells (always 9x9)
  for (let dr = 0; dr < GRID_SIZE; dr++) {
    for (let dc = 0; dc < GRID_SIZE; dc++) {
      const r = grid.r + dr;
      const c = grid.c + dc;
      const key = `${r},${c}`;
      if (!newCells[key]) {
        newCells[key] = { val: null, isGiven: false };
      }
    }
  }

  // Add standard 3x3 box regions
  for (let boxR = 0; boxR < GRID_SIZE / BOX_H; boxR++) {
    for (let boxC = 0; boxC < GRID_SIZE / BOX_W; boxC++) {
      const regionCells: Position[] = [];
      for (let i = 0; i < BOX_H; i++) {
        for (let j = 0; j < BOX_W; j++) {
          regionCells.push({ r: grid.r + boxR * BOX_H + i, c: grid.c + boxC * BOX_W + j });
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
