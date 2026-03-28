"use client";

import { useState, useRef, useEffect } from "react";
import { useBoard } from "../context/BoardContext";

const TABS = ["Create", "Categories", "Support"] as const;
type Tab = (typeof TABS)[number];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("Create");
  const { isMarkerActive, setIsMarkerActive } = useBoard();
  const [isMinimized, setIsMinimized] = useState(false);
  const [width, setWidth] = useState(33); // Starting with 33%
  const [isDragging, setIsDragging] = useState(false);
  
  // ... rest of resizing logic stays same
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  };

  const stopResizing = () => {
    isResizing.current = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 5 && newWidth < 80) {
      setWidth(newWidth);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      style={{ width: isMinimized ? "64px" : `${width}%` }}
      className={`flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50 hidden md:flex flex-col relative ${
        isDragging ? "" : "transition-[width] duration-300 ease-in-out"
      }`}
    >
      {/* Minimize / Expand Toggle */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 transition-transform active:scale-90 shadow-sm"
        title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
      >
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${isMinimized ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Resize Handle */}
      {!isMinimized && (
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors z-20"
        />
      )}

      {/* Top Row Labels / Tabs */}
      <div className={`flex border-b border-zinc-200 dark:border-zinc-800 overflow-hidden ${isMinimized ? "flex-col border-b-0" : ""}`}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            } ${isMinimized ? "p-4 border-b-0 border-r-2" : ""}`}
            title={tab}
          >
            {isMinimized ? tab.charAt(0) : tab}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto ${isMinimized ? "hidden" : "p-6"}`}>
        {activeTab === "Create" && (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setIsMarkerActive(!isMarkerActive)}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all shadow-lg active:scale-95 border-2 ${
                  isMarkerActive
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50"
                    : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${isMarkerActive ? "scale-110" : "scale-100"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="truncate">Marker Number</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 italic">
                Creation Suite
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Toggle <strong>Marker Mode</strong> to write fixed, bold numbers on the board. When disabled, you can write regular strokes without overwriting markers.
              </p>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "Categories" && (
          <div className="space-y-3">
            {["Primary Level", "Secondary Data", "Tertiary Log"].map((cat, i) => (
              <div key={cat} className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                <span className="text-sm font-semibold">{cat}</span>
                <p className="text-xs text-zinc-500 mt-1">Classification level {i + 1}</p>
              </div>
            ))}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === "Support" && (
          <div className="space-y-4">
             {["User Guide", "Keyboard Shortcuts", "API References"].map((item) => (
               <a key={item} href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <span className="text-sm">{item}</span>
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
               </a>
             ))}
          </div>
        )}
      </div>


      {!isMinimized && (
        <div className="mt-auto p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20">
          <div className="flex items-center justify-between overflow-hidden">
            <p className="text-xs font-medium text-zinc-400 uppercase truncate">System Status</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
