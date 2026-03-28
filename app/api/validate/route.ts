import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const puzzle = await req.json();
    const tmpDir = join(process.cwd(), "tmp");
    
    // Ensure tmp directory exists
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }

    const tempFileName = `temp_puzzle_${Date.now()}_${Math.floor(Math.random() * 1000)}.json`;
    const tempFilePath = join(tmpDir, tempFileName);

    // Save puzzle to temp file
    await writeFile(tempFilePath, JSON.stringify(puzzle), "utf8");

    // Execute Python script
    const scriptPath = join(process.cwd(), "scripts", "validate_puzzle.py");
    const pythonBin = process.env.VERCEL ? "python3" : (process.platform === "win32" ? "python" : "python3");
    const cmd = `${pythonBin} "${scriptPath}" "${tempFilePath}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { env: { ...process.env, PYTHONPATH: join(process.cwd(), ".python_packages") } }, async (error, stdout, stderr) => {
        // Clean up temp file
        try {
          await unlink(tempFilePath);
        } catch (err) {
          console.error("Failed to delete temp file:", err);
        }

        if (error) {
          // It could be a rule violation (exit code 1) OR an environment error (python not found)
          resolve(NextResponse.json({ 
            valid: false, 
            message: stdout.includes("❌ INVALID") ? "Puzzle Rules Violation" : "Validation Script Error", 
            output: stdout || stderr || error.message 
          }));
        } else {
          resolve(NextResponse.json({ 
            valid: true, 
            message: "Valid Puzzle", 
            output: stdout 
          }));
        }
      });
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
