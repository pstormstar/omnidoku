export interface Position {
  r: number;
  c: number;
}

export interface CellData {
  val: number | null;
  isGiven: boolean;
  color?: string;
  candidates?: number[];
}

export type RegionType = 'box' | 'row' | 'column' | 'jigsaw' | 'variant' | 'extra';

export interface Region {
  id: string; // Unique identifier for the constraint
  type: RegionType;
  cells: Position[];
  gridId?: string; // Optional: The board that "owns" this constraint
}

export interface Thermometer {
  path: Position[];
}

export interface Cage {
  cells: Position[];
  sum?: number;
}

export interface AdjacentClue {
  type: "X" | "V" | "Kropki" | "Inequality";
  pos1: Position;
  pos2: Position;
  subType?: "black" | "white" | ">" | "<";
}

export interface LittleKiller {
  sum: number;
  direction: "dr" | "dl" | "ur" | "ul";
  start: Position; // The cell just outside the grid pointing inwards
}

export interface Sandwich {
  sum: number;
  r: number;
  c: number;
  row?: number;
  col?: number;
  gridId?: string;
}

export interface Quadruple {
  values: number[];
  r: number; // Row index of top-left cell in the 2x2
  c: number; // Col index of top-left cell in the 2x2
}

export interface Arrow {
  bulb: Position[]; // Sometimes multi-cell bulbs exist
  path: Position[];
}

/**
 * All grids are 9x9 with 3x3 boxes.
 */
export interface GridDef {
  id: string;
  r: number; // Calculated top-left row
  c: number; // Calculated top-left column
  // Pivot point where the grid was anchored
  pivotR: number;
  pivotC: number;
  // Alignment: which corner of the grid is the pivot?
  // 1,1 = Pivot is Top-Left; -1,1 = Pivot is Bottom-Left; 1,-1 = Pivot is Top-Right; -1,-1 = Pivot is Bottom-Right
  dr: number;
  dc: number;
}

/** Fixed grid size for all boards */
export const GRID_SIZE = 9;
/** Fixed box width */
export const BOX_W = 3;
/** Fixed box height */
export const BOX_H = 3;

export interface PuzzleDef {
  title?: string;
  author?: string;
  rules?: string;

  /**
   * Defined grids in this multisudoku
   */
  grids: GridDef[];

  /**
   * Defines active cells in the grid.
   * The keys should be formatted as `${r},${c}` (e.g., "0,5" or "-1,-1" for multisudokus).
   * Utilizing a sparse representation allows interlocking grids with potentially negative coordinates.
   */
  cells: Record<string, CellData>;

  /**
   * Regions (Boxes / Jigsaw Regions)
   */
  regions: Region[];

  /**
   * Active Variant Constraints
   */
  thermometers?: Thermometer[];
  cages?: Cage[];
  adjacentClues?: AdjacentClue[];
  littleKillers?: LittleKiller[];
  sandwiches?: Sandwich[];
  quadruples?: Quadruple[];
  arrows?: Arrow[];

  // Global flags
  diagonals?: boolean; // Main X diagonals
  nonConsecutive?: boolean;
  allXVGiven?: boolean;
  allKropkiGiven?: boolean;
  antiknight?: boolean;
  antiking?: boolean;
}
