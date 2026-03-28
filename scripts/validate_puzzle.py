import json
import sys
import os

GRID_SIZE = 9

def validate_puzzle(puzzle_data):
    """
    Validates an Omnidoku puzzle JSON (9x9 grids only).
    Checks for:
    1. Duplicates in every defined 'region' (boxes, custom constraints).
    2. Duplicates in every Row for every defined grid.
    3. Duplicates in every Column for every defined grid.
    """
    grids = puzzle_data.get("grids", [])
    cells = puzzle_data.get("cells", {})
    regions = puzzle_data.get("regions", [])

    is_valid = True
    errors = []

    # 1. Validate Regions (Boxes)
    for i, region in enumerate(regions):
        seen = {}
        for pos in region.get("cells", []):
            key = f"{pos['r']},{pos['c']}"
            cell_data = cells.get(key, {})
            val = cell_data.get("val")
            if val is not None:
                if val in seen:
                    errors.append(f"Region {i+1} duplicate: '{val}' at cell ({key}) same as ({seen[val]}).")
                    is_valid = False
                seen[val] = key

    # 2. Validate Rows & Columns for each defined Grid (always 9x9)
    for grid in grids:
        grid_id = grid.get("id", "unnamed")
        g_r, g_c = grid["r"], grid["c"]

        # Check Rows
        for r in range(g_r, g_r + GRID_SIZE):
            seen = {}
            for c in range(g_c, g_c + GRID_SIZE):
                key = f"{r},{c}"
                val = cells.get(key, {}).get("val")
                if val is not None:
                    if val in seen:
                        errors.append(f"Grid '{grid_id}', Row {r} duplicate: '{val}' at cell ({key}) same as ({seen[val]}).")
                        is_valid = False
                    seen[val] = key

        # Check Columns
        for c in range(g_c, g_c + GRID_SIZE):
            seen = {}
            for r in range(g_r, g_r + GRID_SIZE):
                key = f"{r},{c}"
                val = cells.get(key, {}).get("val")
                if val is not None:
                    if val in seen:
                        errors.append(f"Grid '{grid_id}', Column {c} duplicate: '{val}' at cell ({key}) same as ({seen[val]}).")
                        is_valid = False
                    seen[val] = key

    # 3. Validate Adjacent Clues (X and V)
    adjacent_clues = puzzle_data.get("adjacentClues", [])
    for clue in adjacent_clues:
        ctype = clue.get("type")
        pos1 = clue.get("pos1")
        pos2 = clue.get("pos2")
        key1 = f"{pos1['r']},{pos1['c']}"
        key2 = f"{pos2['r']},{pos2['c']}"
        v1 = cells.get(key1, {}).get("val")
        v2 = cells.get(key2, {}).get("val")
        
        if v1 is not None and v2 is not None:
            if ctype == "X":
                if v1 + v2 != 10:
                    errors.append(f"X clue violation: {v1} + {v2} = {v1+v2} (should be 10) at {key1}-{key2}")
                    is_valid = False
                    errors.append(f"V clue violation: {v1} + {v2} = {v1+v2} (should be 5) at {key1}-{key2}")
                    is_valid = False
            elif ctype == "Kropki":
                subType = clue.get("subType", "white")
                if subType == "white":
                    if abs(v1 - v2) != 1:
                        errors.append(f"White Kropki violation: {v1} and {v2} are not consecutive at {key1}-{key2}")
                        is_valid = False
                elif subType == "black":
                    if v1 * 2 != v2 and v2 * 2 != v1:
                        errors.append(f"Black Kropki violation: {v1} and {v2} do not have a 1:2 ratio at {key1}-{key2}")
                        is_valid = False
            elif ctype == "Inequality":
                subType = clue.get("subType", ">")
                if subType == ">":
                    if v1 <= v2:
                        errors.append(f"Inequality violation: {v1} is not > {v2} at {key1}-{key2}")
                        is_valid = False
                elif subType == "<":
                    if v1 >= v2:
                        errors.append(f"Inequality violation: {v1} is not < {v2} at {key1}-{key2}")
                        is_valid = False

    # 4. Validate All XV Given (Negative Constraint)
    if puzzle_data.get("allXVGiven", False):
        # Create a set of edges that have clues
        clued_edges = set()
        for clue in adjacent_clues:
            p1 = clue["pos1"]
            p2 = clue["pos2"]
            edge = tuple(sorted([(p1["r"], p1["c"]), (p2["r"], p2["c"])]))
            clued_edges.add(edge)
        
        # Check all adjacent pairs on the board
        all_cells = list(cells.keys())
        for key in all_cells:
            r, c = map(int, key.split(","))
            for dr, dc in [(0, 1), (1, 0)]:
                nr, nc = r + dr, c + dc
                nkey = f"{nr},{nc}"
                if nkey in cells:
                    edge = tuple(sorted([(r, c), (nr, nc)]))
                    if edge not in clued_edges:
                        v1 = cells[key].get("val")
                        v2 = cells[nkey].get("val")
                        if v1 is not None and v2 is not None:
                            if v1 + v2 == 10:
                                errors.append(f"Negative XV violation: {v1} + {v2} = 10 at {key}-{nkey} but no X clue is present.")
                                is_valid = False
                            elif v1 + v2 == 5:
                                errors.append(f"Negative XV violation: {v1} + {v2} = 5 at {key}-{nkey} but no V clue is present.")
                                is_valid = False
    
    # 5. Validate All Kropki Given (Negative Constraint)
    if puzzle_data.get("allKropkiGiven", False):
        kropki_edges = set()
        for clue in adjacent_clues:
            if clue.get("type") == "Kropki":
                p1, p2 = clue["pos1"], clue["pos2"]
                edge = tuple(sorted([(p1["r"], p1["c"]), (p2["r"], p2["c"])]))
                kropki_edges.add(edge)
        
        all_cells = list(cells.keys())
        for key in all_cells:
            r, c = map(int, key.split(","))
            for dr, dc in [(0, 1), (1, 0)]:
                nr, nc = r + dr, c + dc
                nkey = f"{nr},{nc}"
                if nkey in cells:
                    edge = tuple(sorted([(r, c), (nr, nc)]))
                    if edge not in kropki_edges:
                        v1 = cells[key].get("val")
                        v2 = cells[nkey].get("val")
                        if v1 is not None and v2 is not None:
                            if abs(v1 - v2) == 1:
                                errors.append(f"Negative Kropki violation (white): {v1} and {v2} are consecutive at {key}-{nkey} but no white dot.")
                                is_valid = False
                            if v1 * 2 == v2 or v2 * 2 == v1:
                                errors.append(f"Negative Kropki violation (black): {v1} and {v2} have 1:2 ratio at {key}-{nkey} but no black dot.")
                                is_valid = False

    # 6. Validate Antiknight
    if puzzle_data.get("antiknight", False):
        knight_offsets = [(1, 2), (1, -2), (-1, 2), (-1, -2), (2, 1), (2, -1), (-2, 1), (-2, -1)]
        all_cells = list(cells.keys())
        for key in all_cells:
            r, c = map(int, key.split(","))
            v1 = cells[key].get("val")
            if v1 is None: continue
            for dr, dc in knight_offsets:
                nr, nc = r + dr, c + dc
                nkey = f"{nr},{nc}"
                if nkey in cells:
                    v2 = cells[nkey].get("val")
                    if v2 == v1:
                        errors.append(f"Antiknight violation: {v1} at {key} and {nkey} are a knight's move apart.")
                        is_valid = False

    # 7. Validate Antiking
    if puzzle_data.get("antiking", False):
        king_offsets = [(1, 1), (1, -1), (-1, 1), (-1, -1), (0, 1), (0, -1), (1, 0), (-1, 0)]
        all_cells = list(cells.keys())
        for key in all_cells:
            r, c = map(int, key.split(","))
            v1 = cells[key].get("val")
            if v1 is None: continue
            for dr, dc in king_offsets:
                nr, nc = r + dr, c + dc
                nkey = f"{nr},{nc}"
                if nkey in cells:
                    v2 = cells[nkey].get("val")
                    if v2 == v1:
                        # (0,1), (1,0) are already checked by standard Sudoku if in same region, 
                        # but Antiking covers diagonals and across grids too.
                        errors.append(f"Antiking violation: {v1} at {key} and {nkey} are a king's move apart.")
                        is_valid = False

    # 8. Validate Non-Consecutive
    if puzzle_data.get("nonConsecutive", False):
        all_cells = list(cells.keys())
        for key in all_cells:
            r, c = map(int, key.split(","))
            v1 = cells[key].get("val")
            if v1 is None: continue
            for dr, dc in [(0, 1), (1, 0)]:
                nr, nc = r + dr, c + dc
                nkey = f"{nr},{nc}"
                if nkey in cells:
                    v2 = cells[nkey].get("val")
                    if v2 is not None and abs(v1 - v2) == 1:
                        errors.append(f"Non-Consecutive violation: {v1} and {v2} at {key}-{nkey} are consecutive.")
                        is_valid = False

    # 9. Validate Sandwich Clues
    sandwiches = puzzle_data.get("sandwiches", [])
    for s in sandwiches:
        val_sum = s["sum"]
        grid_id = s.get("gridId")
        grid = next((g for g in grids if g["id"] == grid_id), None)
        if not grid: continue
        
        row_idx = s.get("row")
        col_idx = s.get("col")
        
        line_vals = []
        if row_idx is not None:
            for c in range(grid["c"], grid["c"] + 9):
                line_vals.append(cells.get(f"{row_idx},{c}", {}).get("val"))
        elif col_idx is not None:
            for r in range(grid["r"], grid["r"] + 9):
                line_vals.append(cells.get(f"{r},{col_idx}", {}).get("val"))
        
        # We can only validate if both 1 and 9 are present
        if 1 in line_vals and 9 in line_vals:
            idx1 = line_vals.index(1)
            idx9 = line_vals.index(9)
            start, end = min(idx1, idx9), max(idx1, idx9)
            # Sum elements between them
            between = line_vals[start+1 : end]
            # If any are None, we can't fully validate yet, but we can check if current sum exceeds target
            current_sum = sum(v for v in between if v is not None)
            if all(v is not None for v in between):
                if current_sum != val_sum:
                    errors.append(f"Sandwich violation: Row/Col sum between 1 and 9 is {current_sum} (expected {val_sum}) at clue ({s['r']},{s['c']}).")
                    is_valid = False
            else:
                if current_sum > val_sum:
                    errors.append(f"Sandwich violation: Current sum {current_sum} already exceeds {val_sum} at clue ({s['r']},{s['c']}).")
                    is_valid = False

    return is_valid, errors

def main():
    path = "sample_puzzles/standard1.json"
    if len(sys.argv) > 1:
        path = sys.argv[1]

    if not os.path.exists(path):
        print(f"Error: File '{path}' not found.")
        sys.exit(1)

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON in '{path}': {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error reading '{path}': {e}")
        sys.exit(1)

    print(f"Validating puzzle: {path} ...")
    valid, errors = validate_puzzle(data)
    
    if valid:
        print("VALID: The puzzle obeys all constraints (Rows, Cols, Regions).")
    else:
        print(f"INVALID: Found {len(errors)} violations:")
        for err in errors:
            print(f"   {err}")
        sys.exit(1)

if __name__ == "__main__":
    main()
