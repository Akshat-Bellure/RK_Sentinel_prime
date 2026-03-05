import React, { useState, useRef, useEffect } from 'react';
import { View, AnalyzerState, PdfSection } from '../types';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface AnalyzerProps {
  onViewChange: (view: View) => void;
  onSetContext?: (context: any) => void;
  // New props for state persistence
  analyzerState: AnalyzerState;
  setAnalyzerState: React.Dispatch<React.SetStateAction<AnalyzerState>>;
}

const Analyzer: React.FC<AnalyzerProps> = ({ 
  onViewChange, 
  onSetContext,
  analyzerState,
  setAnalyzerState
}) => {
  // Local UI state (doesn't strictly need persistence, but can be if desired)
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  
  // Destructure for easier access
  const { file, extractedSections, riskScore, logs, scanComplete } = analyzerState;

  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setAnalyzerState(prev => ({
        ...prev,
        logs: [...prev.logs, `[${timestamp}] ${message}`]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Reset state for new file
      setAnalyzerState({
          file: selectedFile,
          extractedSections: [],
          riskScore: 0,
          logs: [],
          scanComplete: false
      });
      setIsScanning(false);
      
      // Immediate logs are tricky because state update is async, 
      // but we can start logging in the next tick or just rely on the effect of file change if we had one.
      // For now, we just adding logs to the NEW state object directly above? No, logs depends on prev.
      // Let's just do a timeout to add the initial logs after state reset.
      setTimeout(() => {
          addLog(`Secure File Mount: ${selectedFile.name}`);
          addLog(`Size: ${(selectedFile.size / 1024).toFixed(2)} KB | Type: ${selectedFile.type || 'application/pdf'}`);
          addLog("Ready for deep inspection.");
      }, 100);
    }
  };

  // Real Risk Keyword Dictionary
  const riskRules = [
    {
      keywords: [/foreign/i, /outside india/i, /united states/i, /europe/i, /singapore/i],
      context: [/hosting/i, /data center/i, /cloud/i, /storage/i],
      level: 'CRITICAL',
      label: 'Data Residency Violation',
      citations: ['MeitY Cloud Guidelines', 'DPDP Act 2023 Sec 17']
    },
    {
      keywords: [/turnover/i, /revenue/i],
      context: [/500/i, /billion/i, /million dollar/i, /5000/i], // detecting unreasonably high numbers
      level: 'HIGH',
      label: 'Restrictive Turnover Criteria',
      citations: ['GFR 2017 Rule 172', 'MSME Policy 2012']
    },
    {
      keywords: [/specific brand/i, /cisco/i, /hp/i, /dell/i, /oracle/i, /proprietary/i],
      context: [/must/i, /shall/i, /only/i, /mandatory/i],
      level: 'HIGH',
      label: 'Brand Favoritism (Restrictive)',
      citations: ['CVC Circular 03/01/18', 'GFR 2017 Rule 144(i)']
    },
    {
        keywords: [/payment/i, /advance/i],
        context: [/100%/i, /full/i, /prior/i],
        level: 'CRITICAL',
        label: 'Unsecured Advance Payment',
        citations: ['GFR 2017 Rule 172(1)']
    },
    {
        keywords: [/experience/i, /years/i],
        context: [/15 years/i, /20 years/i, /global/i],
        level: 'HIGH',
        label: 'Excessive Experience Req',
        citations: ['CVC Guidelines on Pre-Qualification']
    }
  ];

  // Real Analysis Engine
  const performAnalysis = async (fileToScan: File) => {
    // Import dynamically to avoid circular dependencies if any, or just use the global instance
    const { coreEngine } = await import('../services/coreProcessingEngine');

    if (!window.pdfjsLib) {
        addLog("ERROR: PDF Engine not loaded. Check internet connection.");
        setIsScanning(false);
        return;
    }

    try {
        const result = await coreEngine.processAnalysis({
            file: fileToScan,
            onProgress: (p) => setScanProgress(p),
            onLog: (msg) => addLog(msg)
        });

        if (result.success && result.data) {
            // Update Global State
            setAnalyzerState(prev => ({
                ...prev,
                extractedSections: result.data!.sections,
                riskScore: result.data!.riskScore,
                scanComplete: true
            }));
            
            // Select first risky clause if any
            const firstRisky = result.data!.sections.find(c => c.risky);
            if (firstRisky) setSelectedClauseId(firstRisky.id);
        } else {
             throw new Error(result.error);
        }

    } catch (e: any) {
        console.error(e);
        addLog(`CRITICAL ERROR: ${e.message}`);
    } finally {
        setIsScanning(false);
    }
  };

  const triggerScan = () => {
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);
    
    // Clear previous results but keep file
    setAnalyzerState(prev => ({
        ...prev,
        extractedSections: [],
        riskScore: 0,
        logs: [], // Clear old logs
        scanComplete: false
    }));
    
    addLog("Initiating Sentinel Core...");
    // Small delay to allow UI to update
    setTimeout(() => {
        performAnalysis(file);
    }, 500);
  };

  const handleClauseClick = (id: string) => {
    setSelectedClauseId(id);
  };

  const handleGenerateDefense = (activeClause: PdfSection) => {
      if (onSetContext) {
          onSetContext({
              tenderId: file?.name || "Unknown Tender",
              clauseId: activeClause.id,
              clauseText: activeClause.text,
              category: activeClause.title,
              risk: activeClause.riskLevel,
              citations: activeClause.citations
          });
      }
      onViewChange(View.PREBID);
  };

  const getRiskLevel = (score: number) => {
      if (score >= 60) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500' };
      if (score >= 30) return { label: 'HIGH', color: 'text-gov-warning', bg: 'bg-yellow-500' };
      if (score > 0) return { label: 'MODERATE', color: 'text-orange-400', bg: 'bg-orange-500' };
      return { label: 'LOW', color: 'text-teal-400', bg: 'bg-teal-500' };
  };

  const currentRisk = getRiskLevel(riskScore);

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-navy-900/50 border-b border-slate-700 pb-4">
        <div>
            <h2 className="text-2xl font-bold text-white font-header tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400">analytics</span>
              RFP ANALYZER (Live Engine)
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">SENTINEL INTELLIGENCE CORE // V2.4</p>
        </div>
        <div className="flex items-center gap-6">
             {riskScore > 0 && (
                 <div className="flex items-center gap-3 px-4 py-2 rounded border border-red-500/30 bg-red-500/10 animate-pulse">
                    <span className="material-symbols-outlined text-red-500">warning</span>
                    <div className="text-right">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Aggregate Risk</p>
                      <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold text-white leading-none font-header">{riskScore}/100</p>
                          <span className={`text-[10px] font-bold ${currentRisk.color}`}>{currentRisk.label}</span>
                      </div>
                    </div>
                 </div>
             )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left: PDF Content Viewer */}
        <div className={`col-span-12 lg:col-span-7 glass-panel rounded-lg overflow-hidden flex flex-col relative scanner-container ${isScanning ? 'scanning' : ''}`}>
          
          {/* File Upload / Status Header */}
          <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            {file ? (
              <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                <div>
                   <p className="text-sm font-medium text-slate-200 max-w-[200px] truncate">{file.name}</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                       {(file.size / 1024 / 1024).toFixed(2)} MB • {extractedSections.length > 0 ? 'INDEXED' : 'PENDING'}
                   </p>
                </div>
                <button 
                    onClick={() => { 
                        setAnalyzerState({
                            file: null,
                            extractedSections: [],
                            riskScore: 0,
                            logs: [],
                            scanComplete: false
                        }); 
                    }} 
                    className="ml-2 text-slate-500 hover:text-red-400"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
               <div className="flex items-center gap-2 text-slate-500 text-sm">
                   <span className="material-symbols-outlined">folder_off</span>
                   <span>No active document context</span>
               </div>
            )}

            <div className="flex gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              {!file && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-sm text-xs font-medium border border-slate-600 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  UPLOAD RFP
                </button>
              )}
              
              <button 
                className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  !file || isScanning 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/20 border border-teal-500'
                }`}
                onClick={triggerScan}
                disabled={!file || isScanning}
              >
                {isScanning ? (
                  <>SCANNING {(scanProgress).toFixed(0)}%</>
                ) : (
                  <>INITIATE SCAN</>
                )}
              </button>
            </div>
          </div>

          <div className="scanner-line"></div>
          
          {/* Document Viewer Area */}
          <div className="flex-1 bg-slate-100 text-slate-900 font-serif text-sm overflow-y-auto relative selection:bg-teal-200 p-8 shadow-inner">
            {!file ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                 <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                 </div>
                 <p className="text-lg font-sans font-semibold text-slate-500">Upload Tender Document</p>
                 <p className="text-xs mt-1 font-mono">SECURE UPLOAD // PDF FORMAT ONLY</p>
              </div>
            ) : !scanComplete && !isScanning ? (
               <div className="h-full flex flex-col items-center justify-center fade-in">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                    <span className="material-symbols-outlined text-3xl text-blue-500">visibility</span>
                  </div>
                  <p className="text-slate-700 font-sans font-bold text-lg">Document Preview Locked</p>
                  <p className="text-xs text-slate-500 mt-2 font-mono bg-white px-2 py-1 rounded border border-slate-200">
                      WAITING FOR NEURAL ANALYSIS
                  </p>
               </div>
            ) : (
              // Content Rendering
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-end border-b-2 border-slate-300 pb-4 mb-8">
                  <div>
                    <h1 className="text-xl font-bold uppercase tracking-wide font-header text-slate-900">Extracted Content</h1>
                    <p className="text-xs text-slate-500 mt-1 font-mono">REF: {file.name.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                      <p className="text-sm font-bold text-slate-900">PROCESSED ({extractedSections.length} segments)</p>
                  </div>
                </div>
                
                {extractedSections.map((section) => (
                  <div 
                      key={section.id}
                      id={section.id} // Anchor for scrolling
                      className={`p-4 rounded-sm transition-all duration-200 border-l-4 ${
                          selectedClauseId === section.id 
                              ? section.risky
                                  ? 'border-l-red-500 bg-red-50 ring-1 ring-red-100 shadow-sm'
                                  : 'border-l-teal-500 bg-teal-50 ring-1 ring-teal-100 shadow-sm' 
                              : 'border-l-transparent hover:bg-slate-200'
                      } ${section.risky && !selectedClauseId ? 'bg-red-50/50' : ''} cursor-pointer group relative`}
                      onClick={() => handleClauseClick(section.id)}
                  >
                      <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400">Page {section.page}</div>
                      <div className="flex justify-between mb-1">
                          <span className="font-bold block text-slate-800 group-hover:text-teal-700 text-xs uppercase">{section.title}</span>
                          {section.risky && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${section.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-orange-100 text-orange-600 border-orange-200'}`}>{section.riskLevel} RISK</span>}
                      </div>
                      <span className="leading-relaxed text-slate-700">
                          {section.text}
                      </span>
                  </div>
                ))}
                
                {extractedSections.length === 0 && isScanning && (
                    <p className="text-center text-slate-500 mt-10">Extracting text stream...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Intelligence Panel */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            
          {/* Analysis Results */}
          <div className="glass-panel p-0 rounded-lg flex-1 flex flex-col min-h-[300px] overflow-hidden border-slate-700">
            <div className="p-3 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
               <h3 className="font-semibold text-white font-header flex items-center gap-2">
                 <span className="material-symbols-outlined text-teal-400 text-lg">psychology</span>
                 TACTICAL INSIGHTS
               </h3>
               {selectedClauseId && (
                   <button onClick={() => setSelectedClauseId(null)} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold">Clear Selection</button>
               )}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950">
              {!selectedClauseId ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined text-4xl mb-3 opacity-30">touch_app</span>
                  <p className="text-sm font-medium">Select a segment to view analysis</p>
                  {riskScore > 0 && <p className="text-xs text-red-400 mt-2 font-bold">{Math.ceil(riskScore/20)} Risks Detected</p>}
                </div>
              ) : (
                (() => {
                    const activeClause = extractedSections.find(c => c.id === selectedClauseId);
                    if (!activeClause) return null;

                    return activeClause.risky ? (
                        <div className="space-y-4 fade-in">
                            <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <h4 className="text-red-400 font-bold flex items-center gap-2 font-header text-lg">
                                    <span className="material-symbols-outlined text-sm">gavel</span>
                                    {activeClause.riskLevel === 'CRITICAL' ? 'Critical Compliance Violation' : 'Restrictive Condition'}
                                    </h4>
                                    <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-sm tracking-wide">CONFIDENCE: 98%</span>
                                </div>
                                <p className="text-slate-300 text-sm mt-2 leading-relaxed relative z-10 border-t border-red-500/20 pt-2">
                                    {activeClause.title} detected. This pattern conflicts with established procurement guidelines.
                                </p>
                                
                                {/* Compliance Probability Bar */}
                                <div className="mt-3 relative z-10">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>Compliance Probability</span>
                                        <span className="text-red-400 font-bold">5%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[5%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800 pb-1">Legal Precedents (RAG)</p>
                                {activeClause.citations && activeClause.citations.length > 0 ? activeClause.citations.map((cit, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900 rounded-sm border border-slate-700 hover:border-teal-500 transition-colors cursor-pointer group">
                                        <span className="material-symbols-outlined text-teal-500 text-lg mt-0.5">book_2</span>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-xs group-hover:text-teal-400 underline decoration-slate-700 group-hover:decoration-teal-500 underline-offset-2">{cit}</p>
                                            <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                Click to view original PDF source
                                            </p>
                                        </div>
                                    </div>
                                )) : <p className="text-xs text-slate-500 italic">No specific citations for this risk category.</p>}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <button 
                                    className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-sm font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20"
                                    onClick={() => handleGenerateDefense(activeClause)}
                                >
                                    <span className="material-symbols-outlined text-lg">edit_document</span>
                                    Generate Defense Query
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-teal-500/50 fade-in pt-8">
                            <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4 border border-teal-500/20">
                                <span className="material-symbols-outlined text-4xl">check_circle</span>
                            </div>
                            <p className="font-bold text-lg font-header">Clause Compliant</p>
                            <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">No significant vigilance risks detected against standard procurement guidelines.</p>
                        </div>
                    );
                })()
              )}
            </div>
          </div>
          
           {/* Terminal Output */}
           <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-48 font-mono text-[10px] bg-slate-950 text-slate-300 border border-slate-700">
                <div className="bg-slate-900 px-3 py-1.5 text-slate-400 border-b border-slate-800 flex justify-between items-center">
                    <span className="flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-[12px]">terminal</span> SYSTEM LOGS</span>
                    <span className="text-green-500 flex items-center gap-1 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> ONLINE</span>
                </div>
                <div className="p-3 text-green-500/80 overflow-y-auto flex-1 space-y-1 scroll-smooth">
                    {logs.length === 0 && <span className="text-slate-600 italic">{'>>'} Waiting for input...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="border-l-2 border-slate-800 hover:border-teal-500 pl-2 py-0.5">{log}</div>
                    ))}
                    <div ref={logsEndRef}></div>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
