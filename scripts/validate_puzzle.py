import json
import sys
import os

def validate_puzzle(puzzle_data):
    """
    Validates an Omnidoku puzzle JSON.
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
    # Regions are the primary way Sudoku boxes/variants are defined in Omnidoku.
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

    # 2. Validate Rows & Columns for each defined Grid
    # This ensures standard Sudoku constraints for every board in a multisudoku.
    for grid in grids:
        grid_id = grid.get("id", "unnamed")
        g_r, g_c = grid["r"], grid["c"]
        size = grid["size"]

        # Check Rows within the grid boundary
        for r in range(g_r, g_r + size):
            seen = {}
            for c in range(g_c, g_c + size):
                key = f"{r},{c}"
                val = cells.get(key, {}).get("val")
                if val is not None:
                    if val in seen:
                        errors.append(f"Grid '{grid_id}', Row {r} duplicate: '{val}' at cell ({key}) same as ({seen[val]}).")
                        is_valid = False
                    seen[val] = key

        # Check Columns within the grid boundary
        for c in range(g_c, g_c + size):
            seen = {}
            for r in range(g_r, g_r + size):
                key = f"{r},{c}"
                val = cells.get(key, {}).get("val")
                if val is not None:
                    if val in seen:
                        errors.append(f"Grid '{grid_id}', Column {c} duplicate: '{val}' at cell ({key}) same as ({seen[val]}).")
                        is_valid = False
                    seen[val] = key

    return is_valid, errors

def main():
    # Detect default path or use CLI argument
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

    # Note: Removed emojis to avoid UnicodeEncodeError in Windows 'cp1252' consoles.
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
