import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const puzzle = await req.json();
    const tmpDir = join(tmpdir(), "omnidoku_tmp");
    
    // Ensure tmp directory exists
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }

    const tempFileName = `unique_check_${Date.now()}.json`;
    const tempFilePath = join(tmpDir, tempFileName);

    await writeFile(tempFilePath, JSON.stringify(puzzle), "utf8");

    const scriptPath = join(process.cwd(), "scripts", "check_unique.py");
    const pythonBin = process.platform === "win32" ? "python" : "python3";
    const cmd = `${pythonBin} "${scriptPath}" "${tempFilePath}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { env: { ...process.env, PYTHONPATH: join(process.cwd(), ".python_packages") } }, async (error, stdout, stderr) => {
        try {
          await unlink(tempFilePath);
        } catch (err) {
          console.error("Cleanup error:", err);
        }

        const isUnique = stdout.includes("RESULT: UNIQUE");
        const isUnsolvable = stdout.includes("RESULT: UNSOLVABLE");
        const isNotUnique = stdout.includes("RESULT: NOT UNIQUE");

        let status = "error";
        if (isUnique) status = "unique";
        else if (isUnsolvable) status = "unsolvable";
        else if (isNotUnique) status = "not_unique";

        resolve(NextResponse.json({ 
          status,
          message: stdout.split("RESULT:")[1]?.trim() || "Search Complete",
          output: stdout || stderr || error?.message 
        }));
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
