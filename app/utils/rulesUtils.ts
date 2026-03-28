import { PuzzleDef } from "../types/puzzle";

/**
 * Autogenerates a ruleset based on the current puzzle configuration.
 */
export function generateAutoRules(puzzle: PuzzleDef): string {
    const rules: string[] = [];

    // Basic Sudoku rules
    rules.push("Normal Sudoku rules apply: Place the digits 1-9 in every cell such that each digit appears exactly once in every row, column, and 3x3 box.");

    // Multisudoku check
    if (puzzle.grids && puzzle.grids.length > 1) {
        rules.push(`Multisudoku Grid: The puzzle consists of ${puzzle.grids.length} overlapping 9x9 grids.`);
    }

    // Global constraints
    if (puzzle.diagonals) {
        rules.push("X-Sudoku: The two main diagonals of every grid must also contain the digits 1-9 without repetition.");
    }

    if (puzzle.antiknight) {
        rules.push("Anti-Knight: Cells separated by a knight's move in chess cannot contain the same digit.");
    }

    if (puzzle.antiking) {
        rules.push("Anti-King: Cells separated by a king's move in chess (including diagonals) cannot contain the same digit.");
    }

    if (puzzle.nonConsecutive) {
        rules.push("Non-Consecutive: Orthogonally adjacent cells cannot contain digits that are consecutive (e.g., 4 and 5 cannot be next to each other).");
    }

    // Local/Adjacent Clues
    const clueTypes = new Set((puzzle.adjacentClues || []).map(c => c.type));
    if (clueTypes.has("X")) {
        rules.push("X Clues: Cells separated by an 'X' must sum to 10.");
    }
    if (clueTypes.has("V")) {
        rules.push("V Clues: Cells separated by a 'V' must sum to 5.");
    }
    if (clueTypes.has("Kropki")) {
        rules.push("Kropki Pairs: Digital dots between cells indicate specific relationships. A white dot indicates consecutive digits; a black dot indicates a 1:2 ratio.");
    }

    // Outside clues
    if (puzzle.sandwiches && puzzle.sandwiches.length > 0) {
        rules.push("Sandwich Sudoku: Numbers outside the grid indicate the sum of the digits sandwiched between the 1 and the 9 in that row or column.");
    }

    // Jigsaws
    if (puzzle.regions && puzzle.regions.some(r => r.type === 'jigsaw')) {
        rules.push("Jigsaw (Irregular) Regions: The custom outlined regions must also contain the digits 1-9 exactly once.");
    }

    // Windoku
    if (puzzle.regions && puzzle.regions.some(r => r.type === 'variant')) {
         // Check if it's Windoku (usually variant regions in 3x3 layout)
         rules.push("Windoku (Hyper Sudoku): The four shaded 3x3 regions must also contain the digits 1-9 exactly once.");
    }

    return rules.join("\n\n");
}
