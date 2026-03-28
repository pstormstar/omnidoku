import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const dirPath = join(process.cwd(), "premade_puzzles");
    const files = await readdir(dirPath);
    const jsonFiles = files.filter(f => f.endsWith(".json"));

    const puzzles = await Promise.all(jsonFiles.map(async (filename) => {
        const filePath = join(dirPath, filename);
        const content = await readFile(filePath, "utf-8");
        const puzzleData = JSON.parse(content);
        return {
            filename,
            title: puzzleData.title || filename.replace(".json", ""),
            data: puzzleData
        };
    }));

    return NextResponse.json(puzzles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
