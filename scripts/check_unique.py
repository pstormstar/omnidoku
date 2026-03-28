import json
import sys
import os

try:
    from z3 import Solver, Int, And, Or, Distinct, sat
except ImportError:
    print("Error: The 'z3-solver' library is required. Install via 'pip install z3-solver'.")
    sys.exit(1)

def solve_sudoku(puzzle_data):
    cells = puzzle_data.get("cells", {})
    grids = puzzle_data.get("grids", [])
    regions = puzzle_data.get("regions", [])

    all_cell_keys = list(cells.keys())
    
    cell_allowed_max = {}
    for grid in grids:
        gr, gc, size = grid["r"], grid["c"], grid["size"]
        for r in range(gr, gr + size):
            for c in range(gc, gc + size):
                key = f"{r},{c}"
                if key in cells:
                    cell_allowed_max[key] = min(cell_allowed_max.get(key, 999), size)

    groups = []
    for reg in regions:
        group = [f"{p['r']},{p['c']}" for p in reg["cells"]]
        groups.append(group)

    for grid in grids:
        gr, gc, size = grid["r"], grid["c"], grid["size"]
        for r in range(gr, gr + size):
            group = [f"{r},{c}" for c in range(gc, gc + size) if f"{r},{c}" in cells]
            if len(group) > 1: groups.append(group)
        for c in range(gc, gc + size):
            group = [f"{r},{c}" for r in range(gr, gr + size) if f"{r},{c}" in cells]
            if len(group) > 1: groups.append(group)

    current_values = {key: cells[key].get("val") for key in all_cell_keys}

    solver = Solver()
    
    # Create Z3 variables
    z3_vars = {}
    for key in all_cell_keys:
        v = Int(key)
        z3_vars[key] = v
        if current_values[key] is not None:
            solver.add(v == current_values[key])
        else:
            max_val = cell_allowed_max.get(key, 9)
            solver.add(v >= 1, v <= max_val)

    # remove duplicate constraints to save overhead
    unique_groups = set(tuple(sorted(g)) for g in groups)
    for group in unique_groups:
        solver.add(Distinct([z3_vars[k] for k in group]))

    solutions = []
    
    if solver.check() == sat:
        m = solver.model()
        sol1 = {k: m[z3_vars[k]].as_long() for k in all_cell_keys}
        solutions.append(sol1)
        
        # Block the first solution to find if a second one exists
        block = []
        for k in all_cell_keys:
            block.append(z3_vars[k] != sol1[k])
        solver.add(Or(block))
        
        if solver.check() == sat:
            m2 = solver.model()
            sol2 = {k: m2[z3_vars[k]].as_long() for k in all_cell_keys}
            solutions.append(sol2)

    return solutions

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_unique.py <puzzle.json>")
        return

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    with open(file_path, 'r') as f:
        puzzle_data = json.load(f)

    print(f"Checking uniqueness for: {file_path}", flush=True)
    solutions = solve_sudoku(puzzle_data)

    if len(solutions) == 0:
        print("RESULT: UNSOLVABLE (0 solutions found)")
    elif len(solutions) == 1:
        print("RESULT: UNIQUE (Exactly 1 solution found)")
    else:
        print(f"RESULT: NOT UNIQUE ({len(solutions)}+ solutions found)")

if __name__ == "__main__":
    main()
