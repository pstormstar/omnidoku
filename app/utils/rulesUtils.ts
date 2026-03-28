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
        rules.push("X-Sudoku: The two main diagonals (where highlighted) must contain the digits 1-9 without repetition.");
    }

    if (puzzle.antiknight) {
        rules.push("Anti-Knight: Any two cells separated by a knight's move in chess cannot contain the same digit.");
    }

    if (puzzle.antiking) {
        rules.push("Anti-King: Any two cells separated by a king's move in chess (including diagonals) cannot contain the same digit.");
    }

    if (puzzle.nonConsecutive) {
        rules.push("Non-Consecutive: Orthogonally adjacent cells cannot contain digits that are consecutive (e.g., 4 and 5 cannot be next to each other).");
    }

    // Thermometers
    if (puzzle.thermometers && puzzle.thermometers.length > 0) {
        rules.push("Thermometers: Digits must strictly increase along thermometers, starting from the bulb end.");
    }

    // Arrows
    if (puzzle.arrows && puzzle.arrows.length > 0) {
        rules.push("Arrows: The digit in a circle must equal the sum of the digits along its attached arrow.");
    }

    // Killer Cages
    if (puzzle.cages && puzzle.cages.length > 0) {
        rules.push("Killer Cages: Digits in a cage must sum to the number in the top-left corner. Digits may not repeat within a cage.");
    }

    // Local/Adjacent Clues
    const clueTypes = new Set((puzzle.adjacentClues || []).map(c => c.type));
    if (clueTypes.has("X")) {
        rules.push("X-Sums: Cells separated by an 'X' must sum to 10.");
    }
    if (clueTypes.has("V")) {
        rules.push("V-Sums: Cells separated by a 'V' must sum to 5.");
    }
    if (clueTypes.has("Kropki")) {
        const subTypes = new Set((puzzle.adjacentClues || []).filter(c => c.type === "Kropki").map(c => c.subType));
        if (subTypes.has("white") && subTypes.has("black")) {
            rules.push("Kropki Dots: A white dot indicates consecutive digits; a black dot indicates a 1:2 ratio. Not all dots are necessarily given.");
        } else if (subTypes.has("white")) {
            rules.push("Kropki Dots: A white dot between two cells indicates they must contain consecutive digits.");
        } else if (subTypes.has("black")) {
            rules.push("Kropki Dots: A black dot between two cells indicates they must have a 1:2 ratio.");
        }
    }
    if (clueTypes.has("Inequality")) {
        rules.push("Greater Than Signs: A '>' symbol between two cells indicates that the digit on the open side of the sign must be greater than the digit on the pointed side.");
    }

    // Outside clues
    if (puzzle.sandwiches && puzzle.sandwiches.length > 0) {
        rules.push("Sandwiches: Numbers outside the grid indicate the sum of the digits sandwiched between the 1 and the 9 in that row or column.");
    }

    if (puzzle.littleKillers && puzzle.littleKillers.length > 0) {
        rules.push("Little Killers: Numbers outside the grid with an arrow indicate the sum of the digits along that diagonal. Digits may repeat along the diagonal if other rules allow.");
    }

    // Jigsaws & Variants
    if (puzzle.regions && puzzle.regions.some(r => r.type === 'jigsaw')) {
        rules.push("Jigsaw (Irregular) Regions: The custom outlined regions must also contain the digits 1-9 exactly once.");
    }

    if (puzzle.regions && puzzle.regions.some(r => r.type === 'variant')) {
         rules.push("Windoku (Hyper Sudoku): The four shaded 3x3 regions must also contain the digits 1-9 exactly once.");
    }

    // Quadruples
    const hasQuadruples = clueTypes.has("Quadruple") || (puzzle.quadruples && puzzle.quadruples.length > 0);
    if (hasQuadruples) {
        rules.push("Quadruples: Digits in a circle at a 2x2 intersection must appear at least once in the four surrounding cells.");
    }

    return rules.join("\n\n");
}
