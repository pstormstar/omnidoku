import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const puzzle = await req.json();
    const tmpDir = join(process.cwd(), "tmp");
    
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }

    const tempFileName = `unique_check_${Date.now()}.json`;
    const tempFilePath = join(tmpDir, tempFileName);

    await writeFile(tempFilePath, JSON.stringify(puzzle), "utf8");

    const scriptPath = join(process.cwd(), "scripts", "check_unique.py");
    const pythonBin = process.platform === "win32" ? "python" : "python3";
    const cmd = `${pythonBin} "${scriptPath}" "${tempFilePath}"`;

    return new Promise<NextResponse>(async (resolve) => {
      
      if (process.env.VERCEL && process.env.VERCEL_URL) {
          try {
              const res = await fetch(`https://${process.env.VERCEL_URL}/api/bridge`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      script: "check_unique.py",
                      file_content: JSON.stringify(puzzle)
                  })
              });
              const data = await res.json();
              const stdout = data.stdout || "";
              const stderr = data.stderr || "";
              
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
                output: stdout || stderr || data.error 
              }));
              return;
          } catch(e: any) {
              resolve(NextResponse.json({ error: e.message }, { status: 500 }));
              return;
          }
      }

      exec(cmd, async (error, stdout, stderr) => {
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
