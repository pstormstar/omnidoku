import json
import sys
import os

try:
    from z3 import Solver, Int, And, Or, Distinct, sat, Abs
except ImportError:
    print("Error: The 'z3-solver' library is required. Install via 'pip install z3-solver'.")
    sys.exit(1)

GRID_SIZE = 9

def solve_sudoku(puzzle_data):
    cells = puzzle_data.get("cells", {})
    grids = puzzle_data.get("grids", [])
    regions = puzzle_data.get("regions", [])
    all_cell_keys = list(cells.keys())

    solver = Solver()
    # Speed tuning
    solver.set("timeout", 180000) # 3 mins
    
    # 1. Variables
    z3_vars = {}
    for key in all_cell_keys:
        v = Int(key)
        z3_vars[key] = v
        solver.add(v >= 1, v <= GRID_SIZE)
        val = cells[key].get("val")
        if val is not None:
            solver.add(v == val)

    # 2. Sudoku Groups
    groups = []
    for reg in regions:
        groups.append([f"{p['r']},{p['c']}" for p in reg["cells"]])
    
    for grid in grids:
        gr, gc = grid["r"], grid["c"]
        for r in range(gr, gr + GRID_SIZE):
            groups.append([f"{r},{c}" for c in range(gc, gc + GRID_SIZE) if f"{r},{c}" in cells])
        for c in range(gc, gc + GRID_SIZE):
            groups.append([f"{r},{c}" for r in range(gr, gr + GRID_SIZE) if f"{r},{c}" in cells])

    unique_groups = set(tuple(sorted(g)) for g in groups if len(g) > 1)
    for g in unique_groups:
        solver.add(Distinct([z3_vars[k] for k in g]))

    # 3. Clues
    adjacent_clues = puzzle_data.get("adjacentClues", [])
    clued_edges = set()
    for clue in adjacent_clues:
        k1, k2 = f"{clue['pos1']['r']},{clue['pos1']['c']}", f"{clue['pos2']['r']},{clue['pos2']['c']}"
        if k1 in z3_vars and k2 in z3_vars:
            clued_edges.add(tuple(sorted([k1, k2])))
            v1, v2 = z3_vars[k1], z3_vars[k2]
            ct = clue.get("type")
            if ct == "X": solver.add(v1 + v2 == 10)
            elif ct == "V": solver.add(v1 + v2 == 5)
            elif ct == "Kropki":
                st = clue.get("subType", "white")
                if st == "white": solver.add(Abs(v1 - v2) == 1)
                elif st == "black": solver.add(Or(v1 == 2 * v2, v2 == 2 * v1))
            elif ct == "Inequality":
                st = clue.get("subType", ">")
                if st == ">": solver.add(v1 > v2)
                elif st == "<": solver.add(v1 < v2)

    # 4. Global
    for key in all_cell_keys:
        r, c = map(int, key.split(","))
        v1 = z3_vars[key]
        # Ortho
        for dr, dc in [(0, 1), (1, 0)]:
            nk = f"{r+dr},{c+dc}"
            if nk in z3_vars:
                edge = tuple(sorted([key, nk]))
                v2 = z3_vars[nk]
                if puzzle_data.get("nonConsecutive"):
                    solver.add(Abs(v1 - v2) > 1)
                if edge not in clued_edges:
                    if puzzle_data.get("allXVGiven"):
                        solver.add(v1 + v2 != 5, v1 + v2 != 10)
                    if puzzle_data.get("allKropkiGiven"):
                        solver.add(Abs(v1 - v2) != 1, v1 != 2 * v2, v2 != 2 * v1)
        # Antiking
        if puzzle_data.get("antiking"):
            for dr, dc in [(1,1), (1,-1)]:
                nk = f"{r+dr},{c+dc}"
                if nk in z3_vars: solver.add(v1 != z3_vars[nk])
        # Antiknight
        if puzzle_data.get("antiknight"):
            for dr, dc in [(1,2), (1,-2), (2,1), (2,-1)]:
                nk = f"{r+dr},{c+dc}"
                if nk in z3_vars: solver.add(v1 != z3_vars[nk])

    # 5. Sandwich Clues
    from z3 import If
    sandwiches = puzzle_data.get("sandwiches", [])
    for sv in sandwiches:
        sum_val = sv["sum"]
        grid_id = sv.get("gridId")
        grid = next((g for g in grids if g["id"] == grid_id), None)
        if not grid: continue
        
        line_vars = []
        if "row" in sv:
            r = sv["row"]
            for c in range(grid["c"], grid["c"] + 9):
                line_vars.append(z3_vars.get(f"{r},{c}"))
        elif "col" in sv:
            col = sv["col"]
            for r in range(grid["r"], grid["r"] + 9):
                line_vars.append(z3_vars.get(f"{r},{col}"))
        
        if len(line_vars) == 9 and all(v is not None for v in line_vars):
            p1 = Int(f"pos1_{sv['r']}_{sv['c']}")
            p9 = Int(f"pos9_{sv['r']}_{sv['c']}")
            solver.add(p1 >= 0, p1 < 9, p9 >= 0, p9 < 9)
            # Link index variables to grid values
            for idx, v in enumerate(line_vars):
                solver.add(If(v == 1, p1 == idx, True))
                solver.add(If(v == 9, p9 == idx, True))
            
            # The sum between p1 and p9
            actual_sum = 0
            for idx, v in enumerate(line_vars):
                # Only add if it's purely BETWEEN
                is_between = Or(And(idx > p1, idx < p9), And(idx > p9, idx < p1))
                actual_sum += If(is_between, v, 0)
            solver.add(actual_sum == sum_val)

    results = []
    print("Solving first solution...", flush=True)
    if solver.check() == sat:
        m = solver.model()
        sol = {k: m[z3_vars[k]].as_long() for k in all_cell_keys}
        results.append(sol)
        # Non-uniqueness check
        solver.add(Or([z3_vars[k] != sol[k] for k in all_cell_keys]))
        if solver.check() == sat:
            results.append("not unique")
    return results

def main():
    if len(sys.argv) < 2: return
    with open(sys.argv[1]) as f:
        data = json.load(f)
    print(f"Solving {sys.argv[1]}...")
    sols = solve_sudoku(data)
    if not sols: print("RESULT: UNSOLVABLE")
    elif len(sols) == 1: print("RESULT: UNIQUE")
    else: print("RESULT: NOT UNIQUE")

if __name__ == "__main__":
    main()
