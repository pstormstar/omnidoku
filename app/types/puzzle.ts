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

export interface Region {
  cells: Position[];
}

export interface Thermometer {
  path: Position[];
}

export interface Cage {
  cells: Position[];
  sum?: number;
}

export interface KropkiDot {
  type: "black" | "white" | "none";
  pos1: Position;
  pos2: Position;
}

export interface LittleKiller {
  sum: number;
  direction: "dr" | "dl" | "ur" | "ul";
  start: Position; // The cell just outside the grid pointing inwards
}

export interface Sandwich {
  sum: number;
  row?: number;
  col?: number;
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

export interface PuzzleDef {
  title?: string;
  author?: string;
  rules?: string;

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
  kropkiDots?: KropkiDot[];
  littleKillers?: LittleKiller[];
  sandwiches?: Sandwich[];
  quadruples?: Quadruple[];
  arrows?: Arrow[];

  // Global flags
  diagonals?: boolean; // Main X diagonals
  nonConsecutive?: boolean;
}
