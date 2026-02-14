import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';

interface AnalyzerProps {
  onViewChange: (view: View) => void;
}

const Analyzer: React.FC<AnalyzerProps> = ({ onViewChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Risk Keywords (Professional Set)
  const riskKeywords = ['violation', 'non-compliance', 'restrictive', 'monopoly', 'unclear', 'foreign', 'mandatory', 'exclude', 'proprietory', 'turnover'];

  // Mock PDF Text content
  const pdfSections = [
    {
      id: 'clause-4.1',
      title: '4.1 Video Management System (VMS)',
      text: 'The VMS shall support ONVIF Profile S and G. It must be capable of handling 5000+ cameras concurrently.'
    },
    {
      id: 'clause-4.2',
      title: '4.2 Hosting Requirements (CRITICAL FLAG)',
      text: 'The proposed cloud solution must have a primary data center located in the United States or Europe. This is a restrictive condition creating a monopoly for foreign providers and implies non-compliance with data localization norms.',
      risky: true
    },
    {
      id: 'clause-4.3',
      title: '4.3 Analytics',
      text: 'The system must support facial recognition with 99% accuracy.'
    },
    {
      id: 'clause-4.4',
      title: '4.4 Hardware OEM',
      text: 'The OEM for cameras must have been operating in India for at least 10 years and have a turnover of $500M. This mandatory requirement is unclear and may exclude local MSMEs.'
    }
  ];

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        alert("System Protocol Error: Only PDF documents are accepted for parsing.");
        return;
      }
      setFile(selectedFile);
      setScanComplete(false);
      setRiskScore(0);
      setLogs([]);
      addLog(`Secure File Mount: ${selectedFile.name}`);
      addLog(`Size: ${(selectedFile.size / 1024).toFixed(2)} KB | Type: application/pdf`);
      addLog("Ready for deep inspection.");
    }
  };

  const highlightText = (text: string) => {
    if (!selectedClauseId) return text; 
    
    const parts = text.split(new RegExp(`(${riskKeywords.join('|')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          riskKeywords.some(k => k.toLowerCase() === part.toLowerCase()) ? (
            <span key={i} className="bg-red-500/20 text-red-400 px-1 rounded border-b border-red-500 font-semibold" title="Risk Pattern Detected">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const triggerScan = () => {
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);
    setLogs([]);
    setSelectedClauseId(null);
    setRiskScore(0);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 1;
        if (progress > 100) progress = 100;
        setScanProgress(progress);
    }, 150);

    setTimeout(() => addLog(`Initializing Sentinel OCR Engine v2.4...`), 100);
    setTimeout(() => addLog("Establishing secure enclave connection (AES-256)..."), 800);
    setTimeout(() => addLog("Extracting text layer and embedded metadata..."), 1500);
    setTimeout(() => {
      let foundRisks = 0;
      pdfSections.forEach(section => {
        riskKeywords.forEach(kw => {
           if (section.text.toLowerCase().includes(kw)) foundRisks++;
        });
      });
      // Cap risk score at 100
      setRiskScore(Math.min(foundRisks * 15, 100));
      addLog(`Semantic Analysis completed. Identified ${foundRisks} potential risk vectors.`);
    }, 4000);
    
    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);
      setIsScanning(false);
      setScanComplete(true);
      addLog("Report generated successfully.");
      setSelectedClauseId('clause-4.2'); 
    }, 5500);
  };

  const handleClauseClick = (id: string) => {
    setSelectedClauseId(id);
  };

  const getRiskLevel = (score: number) => {
      if (score >= 75) return { label: 'CRITICAL', color: 'text-red-500' };
      if (score >= 40) return { label: 'HIGH', color: 'text-gov-warning' };
      return { label: 'MODERATE', color: 'text-yellow-400' };
  };

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-navy-900/50 border-b border-slate-700 pb-4">
        <div>
            <h2 className="text-2xl font-bold text-white font-header tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400">analytics</span>
              RFP ANALYZER
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">SENTINEL INTELLIGENCE CORE // V2.0</p>
        </div>
        <div className="flex items-center gap-6">
             {riskScore > 0 && (
                 <div className="flex items-center gap-3 px-4 py-2 rounded border border-red-500/30 bg-red-500/10">
                    <span className="material-symbols-outlined text-red-500">warning</span>
                    <div className="text-right">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Risk Index</p>
                      <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold text-white leading-none font-header">{riskScore}/100</p>
                          <span className={`text-[10px] font-bold ${getRiskLevel(riskScore).color}`}>{getRiskLevel(riskScore).label}</span>
                      </div>
                    </div>
                 </div>
             )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left: Document Processing Unit */}
        <div className={`col-span-12 lg:col-span-7 glass-panel rounded-lg overflow-hidden flex flex-col relative scanner-container ${isScanning ? 'scanning' : ''}`}>
          
          {/* File Upload / Status Header */}
          <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            {file ? (
              <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                <div>
                   <p className="text-sm font-medium text-slate-200">{file.name}</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-wide">{(file.size / 1024 / 1024).toFixed(2)} MB • VERIFIED</p>
                </div>
                <button onClick={() => setFile(null)} className="ml-2 text-slate-500 hover:text-red-400">
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
                    <h1 className="text-xl font-bold uppercase tracking-wide font-header text-slate-900">Request For Proposal</h1>
                    <p className="text-xs text-slate-500 mt-1 font-mono">REF: {file.name.toUpperCase().replace('.PDF', '')}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Classification</p>
                      <p className="text-sm font-bold text-slate-900">PUBLIC / OPEN TENDER</p>
                  </div>
                </div>
                
                <p className="font-bold text-lg border-b pb-2 border-slate-300 text-slate-800 font-header">SECTION IV: TECHNICAL SPECIFICATIONS</p>
                
                {pdfSections.map((section) => (
                  <div 
                      key={section.id}
                      className={`p-4 rounded-sm transition-all duration-200 border-l-4 ${
                          selectedClauseId === section.id 
                              ? section.id.includes('4.2') || section.id.includes('4.4') 
                                  ? 'border-l-red-500 bg-red-50 ring-1 ring-red-100 shadow-sm'
                                  : 'border-l-teal-500 bg-teal-50 ring-1 ring-teal-100 shadow-sm' 
                              : 'border-l-transparent hover:bg-slate-200'
                      } ${section.risky && !selectedClauseId ? 'bg-red-50/50' : ''} cursor-pointer group`}
                      onClick={() => handleClauseClick(section.id)}
                  >
                      <div className="flex justify-between mb-1">
                          <span className="font-bold block text-slate-800 group-hover:text-teal-700">{section.title}</span>
                          {section.risky && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">RISK DETECTED</span>}
                      </div>
                      <span className="leading-relaxed text-slate-700">
                          {highlightText(section.text)}
                      </span>
                  </div>
                ))}
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
                  <p className="text-sm font-medium">Select a clause to view analysis</p>
                </div>
              ) : (
                selectedClauseId === 'clause-4.2' ? (
                  <div className="space-y-4 fade-in">
                    <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-sm relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <h4 className="text-red-400 font-bold flex items-center gap-2 font-header text-lg">
                          <span className="material-symbols-outlined text-sm">gavel</span>
                          Data Residency Violation
                        </h4>
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-sm tracking-wide">CONFIDENCE: 98%</span>
                      </div>
                      <p className="text-slate-300 text-sm mt-2 leading-relaxed relative z-10 border-t border-red-500/20 pt-2">
                        The clause mandates foreign hosting (US/EU/Singapore). This explicitly violates <strong>MeitY Guidelines</strong> and the <strong>DPDP Act 2023</strong> regarding sensitive citizen data.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800 pb-1">Legal Precedents (RAG)</p>
                      <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-sm border border-slate-700 hover:border-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-yellow-500 text-lg mt-0.5">book_2</span>
                        <div className="text-xs">
                          <p className="text-white font-semibold">DPDP Act 2023</p>
                          <p className="text-slate-400 mt-0.5">Section 17: Restrictions on Cross-border data transfer.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-sm border border-slate-700 hover:border-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-teal-500 text-lg mt-0.5">cloud_done</span>
                        <div className="text-xs">
                          <p className="text-white font-semibold">MeitY Cloud Empanelment</p>
                          <p className="text-slate-400 mt-0.5">Mandatory in-country hosting for Govt Data.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <button 
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-sm font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20"
                        onClick={() => onViewChange(View.PREBID)}
                      >
                        <span className="material-symbols-outlined text-lg">edit_document</span>
                        Generate Defense Query
                      </button>
                    </div>
                  </div>
                ) : selectedClauseId === 'clause-4.4' ? (
                  <div className="space-y-4 fade-in">
                    <div className="p-4 bg-yellow-900/10 border border-yellow-500/30 rounded-sm">
                      <h4 className="text-yellow-500 font-bold flex items-center gap-2 mb-2 font-header text-lg">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Restrictive Turnover
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed border-t border-yellow-500/20 pt-2">
                        $500M turnover requirement excludes local MSMEs. Can be contested under <strong>Order 2017 (Make in India)</strong> which promotes local supplier participation.
                      </p>
                    </div>
                    <button 
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-sm font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20"
                      onClick={() => onViewChange(View.PREBID)}
                    >
                      <span className="material-symbols-outlined text-lg">edit_document</span>
                      Draft Query
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-teal-500/50 fade-in pt-8">
                     <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4 border border-teal-500/20">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                     </div>
                     <p className="font-bold text-lg font-header">Clause Compliant</p>
                     <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">No significant vigilance risks detected against standard procurement guidelines.</p>
                  </div>
                )
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
                    {logs.length === 0 && <span className="text-slate-600 italic">>> Waiting for input...</span>}
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