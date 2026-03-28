import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, prompt, title, author, rules, structure } = body;
    let apiKey = body.apiKey;
    
    if (!apiKey) {
      // Fallback to local .gemini_api_key
      const keyPaths = [".gemini_api_key", "../.gemini_api_key", "omnidoku/.gemini_api_key"];
      for (const p of keyPaths) {
        if (existsSync(join(process.cwd(), p))) {
            const lines = readFileSync(join(process.cwd(), p), "utf-8").split("\n");
            for (const line of lines) {
                const clean = line.trim();
                if (clean && !clean.startsWith("#")) {
                    apiKey = clean;
                    break;
                }
            }
        }
        if (apiKey) break;
      }
    }

    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing required fields (image or prompt)" }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    let metadata_instructions = "";
    if (title) metadata_instructions += `\n- Clearly render the puzzle title '${title}' at the top of the piece, well away from the grid.`;
    if (author) metadata_instructions += `\n- Display the author attribution 'By ${author}' near the title.`;
    if (rules) metadata_instructions += `\n- Legibly integrate the following rules into a dedicated sidebar or bottom panel: ${rules}`;

    const has_meta = Boolean(metadata_instructions);
    if (!has_meta) {
        metadata_instructions = "\n- Pure Artboard: Do not add any additional text, labels, titles, or rules to the image. Focus purely on the thematic background art.";
    }

    const critical_rule = has_meta 
        ? " 4. CRITICAL: Under no condition should the puzzle title, author name, or rules text be placed inside the 9x9 Sudoku grid. All descriptive text and metadata MUST be kept on the margins, side-panels, or periphery of the image."
        : "";

    const structure_line = structure ? `Puzzle Structure: ${structure} ` : "";

    const full_prompt = `Transform this Sudoku puzzle into a professional, thematic layout. ${structure_line}Thematic Prompt: ${prompt}. Requirements: 1. Maintain the 9x9 grid structure of each grid and all pre-filled numbers with 100% accuracy. 2. Layout Integration: ${metadata_instructions} 3. Style: High-fidelity digital art, cinematic lighting, legible typography for rules and title.${critical_rule}`;

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: full_prompt },
                    { inlineData: { mimeType: "image/png", data: base64Data } }
                ]
            }]
        })
    });

    const data = await res.json();
    
    if (!res.ok) {
        return NextResponse.json({ error: "Generative AI API Error", details: data.error?.message || JSON.stringify(data) }, { status: 500 });
    }

    let generatedImage = null;
    let responseText = "";

    const candidates = data.candidates || [];
    if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
                generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
                responseText += part.text;
            }
        }
    }

    if (!generatedImage) {
         return NextResponse.json({ error: "Output image not found in the AI response.", details: responseText }, { status: 500 });
    }

    return NextResponse.json({ success: true, image: generatedImage, response: responseText, message: "Successfully generated art." });

  } catch (error: any) {
    console.error("AI Art API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
