"use client";

import { useState, useRef, useEffect } from "react";

export default function PublishMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFormattedSVG = (svg: HTMLElement) => {
    // Clone the SVG so we don't modify the live DOM
    const clone = svg.cloneNode(true) as HTMLElement;
    
    // STRIP absolute positioning styles used for the editor layout
    // These styles (top, left, position) interfere with the image's internal viewBox during serialization
    clone.removeAttribute("style");
    // Ensure width and height are preserved as absolute attributes if they were in the style
    clone.setAttribute("width", svg.getAttribute("width") || "");
    clone.setAttribute("height", svg.getAttribute("height") || "");

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);

    // Inject necessary CSS for fonts and Tailwind colors
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
    setIsOpen(false);
  };

  const exportPNG = () => {
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
      // Use the actual board dimensions from the SVG properties for perfect scaling
      const boardWidth = parseFloat(svg.getAttribute("width") || "0");
      const boardHeight = parseFloat(svg.getAttribute("height") || "0");
      
      const scale = 3; // High resolution multiplier
      canvas.width = boardWidth * scale;
      canvas.height = boardHeight * scale;
      
      ctx.fillStyle = "white"; // Solid background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `omnidoku_export_${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${
          isOpen 
            ? "bg-zinc-900 text-white border-zinc-700 shadow-inner" 
            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 shadow-sm"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/>
        </svg>
        PUBLISH
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 right-0 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-top-2 duration-200">
           <button 
             onClick={exportSVG}
             className="w-full px-6 py-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
           >
              <span>SAVE AS SVG</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">PRO</span>
           </button>
           <button 
             onClick={exportPNG}
             className="w-full px-6 py-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
           >
              <span>SAVE AS PNG</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-teal-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">HQ</span>
           </button>
        </div>
      )}
    </div>
  );
}
