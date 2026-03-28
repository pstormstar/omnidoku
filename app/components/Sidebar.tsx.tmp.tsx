                {activeClueSubtab === "adjacent" && (
                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Adjacent Clues</h4>
                     
                     <div className="space-y-3">
                        <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500/60 dark:text-zinc-400/40">Edge Clues</h5>
                        <div className="grid grid-cols-2 gap-3">
                           {(["X", "V"] as const).map((type) => (
                              <button
                                 key={type}
                                 onClick={() => {
                                    if (activeClueType === type) {
                                       setActiveClueType(null);
                                       setActiveClueSubType(null);
                                       setClueSelectionFirst(null);
                                    } else {
                                       setActiveClueType(type);
                                       setActiveClueSubType(null);
                                       setClueSelectionFirst(null);
                                    }
                                 }}
                                 className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === type
                                    ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                    : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                                 }`}
                              >
                                 <span className="text-xl font-black">{type}</span>
                                 <span className="text-[9px] font-bold uppercase tracking-widest">{type === "X" ? "Sum 10" : "Sum 5"}</span>
                              </button>
                           ))}
                           {([
                               { subType: "white", label: "White Dot", desc: "Consecutive" },
                               { subType: "black", label: "Black Dot", desc: "Ratio 1:2" }
                           ] as const).map((k) => (
                              <button
                                 key={k.subType}
                                 onClick={() => {
                                    if (activeClueType === "Kropki" && activeClueSubType === k.subType) {
                                       setActiveClueType(null);
                                       setActiveClueSubType(null);
                                       setClueSelectionFirst(null);
                                    } else {
                                       setActiveClueType("Kropki");
                                       setActiveClueSubType(k.subType);
                                       setClueSelectionFirst(null);
                                    }
                                 }}
                                 className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === "Kropki" && activeClueSubType === k.subType
                                    ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                    : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                                 }`}
                              >
                                 <div className={`w-8 h-8 rounded-full shadow-sm border ${k.subType === "black" 
                                   ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white" 
                                   : "bg-white border-zinc-400 dark:bg-zinc-50 dark:border-zinc-600"}`} 
                                 />
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-center">{k.label}</span>
                              </button>
                           ))}
                           {([
                               { subType: ">", label: "Greater Than", icon: ">" },
                               { subType: "<", label: "Less Than", icon: "<" }
                           ] as const).map((ik) => (
                              <button
                                 key={ik.subType}
                                 onClick={() => {
                                    if (activeClueType === "Inequality" && activeClueSubType === ik.subType) {
                                       setActiveClueType(null);
                                       setActiveClueSubType(null);
                                       setClueSelectionFirst(null);
                                    } else {
                                       setActiveClueType("Inequality");
                                       setActiveClueSubType(ik.subType);
                                       setClueSelectionFirst(null);
                                    }
                                 }}
                                 className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === "Inequality" && activeClueSubType === ik.subType
                                    ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                    : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                                 }`}
                              >
                                 <span className="text-xl font-black">{ik.icon}</span>
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-center">{ik.label}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500/60 dark:text-zinc-400/40">Corner Clues</h5>
                        <div className="grid grid-cols-2 gap-3">
                           <button
                              onClick={() => {
                                 if (activeClueType === "Quadruple") {
                                    setActiveClueType(null);
                                    setActiveClueSubType(null);
                                    setClueSelectionFirst(null);
                                 } else {
                                    setActiveClueType("Quadruple");
                                    setActiveClueSubType(null);
                                    setClueSelectionFirst(null);
                                 }
                              }}
                              className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeClueType === "Quadruple"
                                 ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900 shadow-lg"
                                 : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500"
                              }`}
                           >
                              <div className="w-8 h-8 rounded-full border-2 border-zinc-400 dark:border-zinc-500 flex items-center justify-center font-black text-[10px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">123</div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-center">Quadruple</span>
                           </button>
                        </div>
                     </div>

                     <div className="pt-2">
                        <button
                           onClick={() => {
                              setPuzzle(prev => ({ ...prev, allXVGiven: !prev.allXVGiven }));
                           }}
                           className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all ${puzzle.allXVGiven 
                             ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" 
                             : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                           } active:scale-[0.98]`}
                        >
                           <div className="flex-1 space-y-1">
                              <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.allXVGiven ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}`}>All XV Given</span>
                              <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                 Negative constraint: If no clue is present, adjacent cells CANNOT sum to 5 or 10.
                              </span>
                           </div>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.allXVGiven ? "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${puzzle.allXVGiven ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-600"}`}>
                                {puzzle.allXVGiven && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                           </div>
                        </button>
                        
                        <button
                           onClick={() => {
                              setPuzzle(prev => ({ ...prev, allKropkiGiven: !prev.allKropkiGiven }));
                           }}
                           className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between text-left transition-all mt-2 ${puzzle.allKropkiGiven 
                             ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" 
                             : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
                           } active:scale-[0.98]`}
                        >
                           <div className="flex-1 space-y-1">
                              <span className={`text-xs font-bold uppercase tracking-widest block ${puzzle.allKropkiGiven ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}`}>All Kropki Given</span>
                              <span className="text-[10px] font-medium text-zinc-500 opacity-80 leading-snug block">
                                 Negative constraint: If no dot is present, adjacent cells cannot be consecutive or have a 1:2 ratio.
                              </span>
                           </div>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent transition-all overflow-hidden flex-shrink-0 ml-3 ${puzzle.allKropkiGiven ? "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${puzzle.allKropkiGiven ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-600"}`}>
                                {puzzle.allKropkiGiven && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                           </div>
                        </button>
                     </div>

                     <p className="text-[10px] text-zinc-500 font-medium leading-relaxed px-1 italic">
                       Select a clue type, then click two adjacent cells on the board to place the clue.
                     </p>
                  </div>
                )}
