"use client";

import { useState, useEffect, memo } from "react";
import { createPortal } from "react-dom";

interface ThematicArtModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleImage: string; // Base64 PNG
}

// Optimized Static Preview: Completely static to save layout re-calculations on typing
const PicturePreview = memo(({ src, title, description, isSuccess }: { src: string, title: string, description: string, isSuccess?: boolean }) => (
  <div className={`w-full md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-6 transition-colors duration-300 ${isSuccess ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-zinc-50 dark:bg-zinc-850"}`}>
    <div className="text-center space-y-2">
       <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>{isSuccess ? "SUCCESS" : "Puzzle Source"}</h3>
       <p className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">{title}</p>
    </div>
    
    <div className={`relative ${isSuccess ? "scale-105" : ""}`}>
       <div className={`w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-zinc-800 ${isSuccess ? "shadow-emerald-500/10" : ""}`}>
         {/* Static image with decoding="async" for faster paint */}
         <img src={src} alt="Puzzle Preview" decoding="async" className="w-full h-full object-cover" />
       </div>
       {!isSuccess && (
         <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-2 rounded-lg shadow-md">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
         </div>
       )}
    </div>
    
    <p className="text-[10px] text-zinc-500 text-center leading-relaxed max-w-[200px]">
      {description}
    </p>
  </div>
));

PicturePreview.displayName = "PicturePreview";

export default function ThematicArtModal({ isOpen, onClose, puzzleImage }: ThematicArtModalProps) {
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please provide a prompt.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/generate_art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: puzzleImage, prompt })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.image) {
          setGeneratedImage(data.image);
          setResult("Success! Your thematic art has been generated.");
        } else {
          setResult(data.response);
        }
      } else {
        setError(data.details || "Failed to generate art meta-data.");
      }
    } catch (err: any) {
      setError(err.message || "Connection error.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `omnidoku_art_${Date.now()}.png`;
    link.click();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative transform-gpu">
        
        {/* Left Side: Completely Static Preview */}
        {!generatedImage ? (
          <PicturePreview 
            src={puzzleImage} 
            title="Thematic AI Blueprint" 
            description="The AI will analyze the structure of your multisudoku and blend it into the requested theme." 
          />
        ) : (
          <PicturePreview 
            src={generatedImage} 
            title="Artificial Masterpiece" 
            description="Your masterpiece is ready for use." 
            isSuccess
          />
        )}

        {/* Right Side: Optimized Inputs */}
        <div className="flex-1 p-8 flex flex-col relative overflow-y-auto custom-scrollbar">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="space-y-6">
            <div className="space-y-4">
               <div>
                  <h2 className="text-[18px] font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">Theme Configuration</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">Uses Nano Banana 3 Intelligence</p>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Thematic Prompt</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A cyberpunk neon grid in a rainy Tokyo alley...'"
                    className="w-full px-5 py-5 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl text-[14px] focus:border-zinc-900 dark:focus:border-zinc-50 outline-none transition-all placeholder:text-zinc-400 min-h-[160px] resize-none leading-relaxed"
                  />
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={handleGenerate}
                 disabled={isGenerating}
                 className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl ${
                   isGenerating 
                     ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" 
                     : "bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                 }`}
               >
                 {isGenerating ? "GENERATING..." : "START AI GENERATION"}
               </button>

               {generatedImage && (
                 <button 
                   onClick={downloadImage}
                   className="w-full py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
                 >
                   DOWNLOAD ART
                 </button>
               )}
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-200/20 rounded-xl text-[10px] text-rose-600 dark:text-rose-400 font-bold text-center">
                {error}
              </div>
            )}

            {result && !generatedImage && (
              <div className="p-6 rounded-3xl bg-zinc-900 text-zinc-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-zinc-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AI Response</span>
                </div>
                <div className="text-[12px] leading-relaxed font-bold opacity-90 italic">
                  {result}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
