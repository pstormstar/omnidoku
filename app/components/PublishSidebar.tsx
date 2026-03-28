"use client";

import { useState, useRef, useEffect, memo } from "react";
import { useBoard } from "../context/BoardContext";
import { generateAutoRules } from "../utils/rulesUtils";

// Reuse the PicturePreview component from the old modal logic, but adapted for sidebar width
const SideArtPreview = memo(({ src, title, isSuccess }: { src: string, title: string, isSuccess?: boolean }) => (
  <div className={`w-full p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 transition-all duration-500 shadow-sm ${isSuccess ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-zinc-50 dark:bg-zinc-850"}`}>
    <div className="text-center space-y-1">
       <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ${isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>{isSuccess ? "SUCCESS" : "SOURCE PREVIEW"}</h3>
       <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200">{title}</p>
    </div>
    
    <div className="relative w-full aspect-square">
       <div className={`w-full h-full rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-zinc-800 transition-all duration-500 ${isSuccess ? "shadow-emerald-500/10 scale-105" : ""}`}>
         <img src={src} alt="Art Preview" decoding="async" className="w-full h-full object-cover" />
       </div>
    </div>
  </div>
));

SideArtPreview.displayName = "SideArtPreview";

export default function PublishSidebar() {
  const { isPublishSidebarOpen, setIsPublishSidebarOpen, puzzle, setPuzzle } = useBoard();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPNG, setCurrentPNG] = useState<string | null>(null);

  // Export Logic
  const getFormattedSVG = (svg: HTMLElement) => {
    const clone = svg.cloneNode(true) as HTMLElement;
    clone.removeAttribute("style");
    clone.setAttribute("width", svg.getAttribute("width") || "");
    clone.setAttribute("height", svg.getAttribute("height") || "");

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);

    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
      svg * { font-family: 'Inter', sans-serif !important; }
      .fill-zinc-900 { fill: #18181b !important; }
      .fill-zinc-50 { fill: #fafafa !important; }
      .text-zinc-200 { color: #e4e4e7 !important; stroke: #e4e4e7 !important; }
      .text-zinc-800 { color: #27272a !important; stroke: #27272a !important; }
      .font-extrabold { font-weight: 800 !important; }
      .font-normal { font-weight: 400 !important; }
    `;
    const styleBlock = `<style type="text/css"><![CDATA[${css}]]></style>`;
    
    if (!source.match(/xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    source = source.replace(/>/, `>${styleBlock}`);
    return source;
  };

  const exportSVG = () => {
    const svg = document.getElementById("omnidoku-puzzle-svg");
    if (!svg) return;
    const source = getFormattedSVG(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `omnidoku_export_${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = (forAI = false) => {
    const svg = document.getElementById("omnidoku-puzzle-svg");
    if (!svg) return;
    const source = getFormattedSVG(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const boardWidth = parseFloat(svg.getAttribute("width") || "0");
      const boardHeight = parseFloat(svg.getAttribute("height") || "0");
      const scale = 3; 
      canvas.width = boardWidth * scale;
      canvas.height = boardHeight * scale;
      ctx.fillStyle = "white"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL("image/png");
      
      if (forAI) {
        setCurrentPNG(pngUrl);
      } else {
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `omnidoku_export_${Date.now()}.png`;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // AI Generation Logic
  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please provide a prompt.");
      return;
    }
    exportPNG(true);
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setGeneratedImage(null);
  };

  // Effect to trigger generation once PNG is captured
  useEffect(() => {
    if (isGenerating && currentPNG) {
      const runGen = async () => {
        try {
          const res = await fetch("/api/generate_art", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              image: currentPNG, 
              prompt,
              title: (puzzle.aiIncludeTitle ?? true) ? puzzle.title : undefined,
              author: (puzzle.aiIncludeTitle ?? true) ? puzzle.author : undefined,
              rules: (puzzle.aiIncludeRules ?? true) ? (puzzle.customRules || generateAutoRules(puzzle)) : undefined
            })
          });
          const data = await res.json();
          if (data.success) {
            if (data.image) {
              setGeneratedImage(data.image);
              setResult("Thematic art generated successfully!");
            } else {
              setResult(data.response);
            }
          } else {
            setError(data.details || "Generation failed.");
          }
        } catch (err: any) {
          setError(err.message || "Connection error.");
        } finally {
          setIsGenerating(false);
          setCurrentPNG(null); 
        }
      };
      runGen();
    }
  }, [isGenerating, currentPNG, prompt]);

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `omnidoku_art_${Date.now()}.png`;
    link.click();
  };

  const [width, setWidth] = useState(25); 

  if (!isPublishSidebarOpen) return null;

  return (
    <div 
      className="h-full bg-white border-l border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 flex flex-col transition-all duration-300 animate-in slide-in-from-right duration-500 overflow-hidden"
      style={{ width: `${width}%` }}
    >
      {/* Sidebar Header removed as requested */}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        
        {/* Import/Export Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Asset Management</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
             <button 
               onClick={() => {
                 const input = document.createElement("input");
                 input.type = "file";
                 input.accept = ".json";
                 input.onchange = (e) => {
                   const file = (e.target as HTMLInputElement).files?.[0];
                   if (file) {
                     const reader = new FileReader();
                     reader.onload = (re) => {
                       try {
                         const json = JSON.parse(re.target?.result as string);
                         setPuzzle(json);
                       } catch (err) { alert("Invalid puzzle JSON."); }
                     };
                     reader.readAsText(file);
                   }
                 };
                 input.click();
               }}
               className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-zinc-900 dark:hover:border-zinc-50 transition-all text-left"
             >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <div>
                   <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Import Puzzle</span>
                   <span className="block text-[9px] text-zinc-400 font-bold">Load valid .json</span>
                </div>
             </button>

             <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-3 gap-3">
                   <button 
                     onClick={exportSVG}
                     className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 group hover:border-emerald-500 transition-all text-center"
                   >
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">SVG</span>
                   </button>
                   <button 
                     onClick={() => exportPNG()}
                     className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 group hover:border-teal-500 transition-all text-center"
                   >
                      <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">PNG</span>
                   </button>
                   <button 
                     onClick={() => {
                        const data = JSON.stringify(puzzle, null, 2);
                        const blob = new Blob([data], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `omnidoku-puzzle_${Date.now()}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                     }}
                     className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 group hover:border-indigo-500 transition-all text-center"
                   >
                      <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">JSON</span>
                   </button>
                </div>
             </div>
          </div>
        </section>

        {/* AI Art Generation Section */}
        <section className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-900">
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Thematic Synthesis</h4>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[8px] font-black tracking-tighter uppercase">
                 <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                 AI Powered
              </span>
           </div>

           {!generatedImage ? (
             <div className="space-y-4">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your theme... (e.g., 'A rainy Tokyo neon alley')"
                  className="w-full p-6 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl text-[12px] focus:border-zinc-900 dark:focus:border-zinc-50 outline-none transition-all placeholder:text-zinc-400 min-h-[160px] resize-none leading-relaxed"
                />
                <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl mb-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={puzzle.aiIncludeTitle ?? true}
                        onChange={(e) => setPuzzle(p => ({ ...p, aiIncludeTitle: e.target.checked }))}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Embed Title & Author</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={puzzle.aiIncludeRules ?? true}
                        onChange={(e) => setPuzzle(p => ({ ...p, aiIncludeRules: e.target.checked }))}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Embed Rules</span>
                   </label>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg ${
                    isGenerating 
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                      : "bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><circle cx={12} cy={12} r={10} strokeOpacity={0.2} /><path d="M12 2a10 10 0 0110 10" /></svg>
                      Synthesizing...
                    </>
                  ) : "Generate AI Art"}
                </button>

                <div className="p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 font-mono text-[9px] text-zinc-400/80 overflow-hidden leading-relaxed">
                    <div className="flex items-center gap-2 mb-3 opacity-60">
                       <div className="w-1 h-1 rounded-full bg-zinc-400" />
                       <span className="uppercase tracking-[0.2em] font-black">Synthesis Blueprint</span>
                    </div>
                    <div className="space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar-mini pr-2 whitespace-pre-wrap leading-relaxed opacity-80 text-[7px]">
                       {(() => {
                         const rulesText = (puzzle.aiIncludeRules ?? true) ? (puzzle.customRules || generateAutoRules(puzzle)) : "";
                         const titleText = (puzzle.aiIncludeTitle ?? true) ? puzzle.title : "";
                         const authorText = (puzzle.aiIncludeTitle ?? true) ? puzzle.author : "";

                         let meta = "";
                         if (titleText) meta += `\n- Clearly render the puzzle title '${titleText}' at the top of the piece.`;
                         if (authorText) meta += `\n- Display the author attribution 'By ${authorText}' near the title.`;
                         if (rulesText) meta += `\n- Legibly integrate the following rules into a dedicated sidebar or bottom panel: ${rulesText}`;

                         let finalMeta = meta.trim();
                         if (!finalMeta) finalMeta = "Pure Artboard: Do not add any additional text, labels, titles, or rules to the image. Focus purely on the thematic background art.";

                         return `Transform this Sudoku puzzle into a professional, thematic layout.\nThematic Prompt: ${prompt || "..."}\n\nRequirements:\n1. Maintain the 9x9 grid structure and all pre-filled numbers with 100% accuracy.\n2. Layout Integration: ${finalMeta}\n3. Style: High-fidelity digital art, cinematic lighting, legible typography for rules and title.`;
                       })()}
                    </div>
                </div>
             </div>
           ) : (
             <div className="space-y-6 animate-in fade-in duration-500">
                <SideArtPreview 
                  src={generatedImage} 
                  title="Artificial Interpretation" 
                  isSuccess
                />
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => { setGeneratedImage(null); setResult(null); }}
                     className="py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                   >
                     New Prompt
                   </button>
                   <button 
                     onClick={downloadImage}
                     className="py-4 rounded-2xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
                   >
                     Download
                   </button>
                </div>
             </div>
           )}

           {error && (
             <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-200/20 rounded-xl text-[9px] text-rose-600 dark:text-rose-400 font-bold text-center">
               {error}
             </div>
           )}

           {result && !generatedImage && (
             <div className="p-6 rounded-3xl bg-zinc-900 text-zinc-100 text-[11px] leading-relaxed italic font-medium">
                <div className="w-8 h-1 bg-zinc-700/50 rounded-full mb-4" />
                {result}
             </div>
           )}
        </section>

      </div>
    </div>
  );
}
