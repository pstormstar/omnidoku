import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, apiKey, title, author, rules, structure } = await req.json();
    
    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing required fields (image or prompt)" }, { status: 400 });
    }

    const tmpDir = join(process.cwd(), "tmp");
    if (!existsSync(tmpDir)) {
      await mkdir(tmpDir, { recursive: true });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempFileName = `ai_art_input_${Date.now()}.png`;
    const tempFilePath = join(tmpDir, tempFileName);
    await writeFile(tempFilePath, buffer);

    const scriptPath = join(process.cwd(), "scripts", "generate_thematic_image.py");
    
    // Build the command with metadata arguments
    // We escape double quotes to handle common text inputs
    const pythonBin = process.env.VERCEL ? "python3" : (process.platform === "win32" ? "python" : "python3");
    let cmd = `${pythonBin} "${scriptPath}" --image "${tempFilePath}" --prompt "${prompt.replace(/"/g, '\\"')}"`;
    
    if (apiKey) cmd += ` --api_key "${apiKey}"`;
    if (title) cmd += ` --title "${title.replace(/"/g, '\\"')}"`;
    if (author) cmd += ` --author "${author.replace(/"/g, '\\"')}"`;
    if (rules) {
      // For massive rules text, we'll save it to a temp file and tell the script to read it
      const rulesPath = join(tmpDir, `rules_${Date.now()}.txt`);
      await writeFile(rulesPath, rules);
      cmd += ` --rules_file "${rulesPath}"`;
    }
    if (structure) {
      const structurePath = join(tmpDir, `structure_${Date.now()}.txt`);
      await writeFile(structurePath, structure);
      cmd += ` --structure_file "${structurePath}"`;
    }

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { env: { ...process.env, PYTHONPATH: join(process.cwd(), ".python_packages") } }, async (error, stdout, stderr) => {
        // Cleanup
        try {
          await unlink(tempFilePath);
          if (cmd.includes("--rules_file")) {
            const rulesMatch = cmd.match(/--rules_file "([^"]+)"/);
            if (rulesMatch) await unlink(rulesMatch[1]).catch(() => {});
          }
          if (cmd.includes("--structure_file")) {
            const structureMatch = cmd.match(/--structure_file "([^"]+)"/);
            if (structureMatch) await unlink(structureMatch[1]).catch(() => {});
          }
        } catch (err) {}

        if (error) {
          resolve(NextResponse.json({ success: false, error: "Generation Failed", details: stdout || stderr || error.message }));
          return;
        }

        if (stdout.includes("Error:") || stdout.toLowerCase().includes("failed")) {
            resolve(NextResponse.json({ success: false, error: "Python Script Error", details: stdout }));
            return;
        }

        let responseText = "";
        let generatedImage = null;

        if (stdout.includes("IMAGE_GENERATED:")) {
          const match = stdout.match(/IMAGE_GENERATED:\s*([^\s\r\n]+)/);
          if (match && match[1]) {
            const imagePath = match[1].trim();
            if (existsSync(imagePath)) {
              try {
                const imageBuffer = await readFile(imagePath);
                generatedImage = `data:image/png;base64,${imageBuffer.toString("base64")}`;
                await unlink(imagePath);
              } catch (e) {}
            }
          }
        }

        const delimiter = "--- GEMINI IMAGE RESPONSE ---";
        const parts = stdout.split(delimiter);
        if (!generatedImage) {
          responseText = parts.length > 1 ? parts[1].trim() : stdout;
        }

        resolve(NextResponse.json({ success: true, response: responseText, image: generatedImage }));
      });
    });
  } catch (error: any) {
    console.error("AI Art API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
