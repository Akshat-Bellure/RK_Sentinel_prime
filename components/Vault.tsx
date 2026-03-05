import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// Mock Data for Clauses
const mockClauses = [
  { id: 'c1', title: '4.1 Video Management', text: 'VMS shall support ONVIF Profile S and G.', required_evidence: 'Datasheet' },
  { id: 'c2', title: '4.2 Hosting Locality', text: 'Data must be hosted in India (MeitY Empanelled).', required_evidence: 'Self-Declaration' },
  { id: 'c3', title: '4.4 OEM Turnover', text: 'OEM must have $500M turnover in last 3 FY.', required_evidence: 'Audited Balance Sheet' },
  { id: 'c4', title: '5.1 Cybersecurity', text: 'Solution must be ISO 27001 certified.', required_evidence: 'ISO Certificate' },
];

interface VaultFile {
  id: string;
  filename: string;
  version: number;
  size: number;
  file_sha256: string;
  upload_time: string;
  verified: boolean;
  tags: string[];
  expiry_date: string;
  s3_key?: string;
  extracted_content?: string; // Store simulated extracted text
}

interface VerificationResult {
  verified: boolean;
  reason: string;
  analyzed_text?: string;
}

const Vault: React.FC = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [publicKeys, setPublicKeys] = useState<any[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedClause, setSelectedClause] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // ClauseID -> FileID
  const [verifying, setVerifying] = useState<Record<string, boolean>>({}); // ClauseID -> boolean
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({}); // FileID -> Result
  const [manifestData, setManifestData] = useState<any>(null);
  const [expandedContext, setExpandedContext] = useState<string | null>(null); // To toggle extracted text view

  // Fetch Keys on Load
  useEffect(() => {
    // Mock Fetch
    setPublicKeys([
      { id: 'key-ap-south-1-001', algo: 'RSA-2048', thumb: 'a1b2c3...', created: '2023-10-01' }
    ]);
  }, []);

  const handleConnectWallet = () => {
    // Simulate Connect
    setTimeout(() => {
      setWalletConnected(true);
    }, 800);
  };

  // Simulate OCR text extraction based on filename context
  const generateMockContent = (filename: string): string => {
      const lower = filename.toLowerCase();
      
      if (lower.includes('datasheet') || lower.includes('spec')) {
          return "PRODUCT SPECIFICATION SHEET v2.4\n\n- Model: X-500\n- Video Compression: H.265\n- Interoperability: Fully compliant with ONVIF Profile S and Profile G protocols.\n- Power Source: PoE+ IEEE 802.3at\n- Operating Temp: -10C to 55C";
      }
      if (lower.includes('hosting') || lower.includes('cloud') || lower.includes('declaration')) {
          return "SELF-DECLARATION OF DATA LOCALIZATION\n\nTo the Tender Inviting Authority:\n\nWe hereby certify that all data related to this project will be hosted exclusively within the territorial jurisdiction of India. Our primary data center is located in Mumbai (AWS ap-south-1), which is MeitY empanelled for Government Community Cloud.";
      }
      if (lower.includes('balance') || lower.includes('audit') || lower.includes('financial')) {
          return "AUDITED FINANCIAL STATEMENT FY 2023-24\n\n- Annual Revenue: $620 Million USD\n- Net Profit: $45 Million USD\n- R&D Investment: $120 Million USD\n\nAuditor: Deloitte & Touche";
      }
      if (lower.includes('iso') || lower.includes('cert')) {
          return "CERTIFICATE OF REGISTRATION\n\nStandard: ISO/IEC 27001:2013\nScope: Information Security Management System for Cloud Services.\nExpiry: 2026-12-31\n\nCertifying Body: BSI Group.";
      }
      
      return "GENERIC DOCUMENT CONTENT\n\nThis document contains general company information. It does not explicitly mention technical specifications, financial figures, or hosting locations required for compliance verification.";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      // Simulate extraction immediately for demo purposes
      const extractedText = generateMockContent(file.name);

      setTimeout(() => {
          const mockFile: VaultFile = {
              id: "v-local-" + Math.floor(Math.random() * 10000),
              filename: file.name,
              version: 1,
              size: file.size,
              file_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Mock Hash
              upload_time: new Date().toISOString(),
              verified: false,
              tags: ["Uploaded", "OCR-Processed"],
              expiry_date: "2025-12-31",
              extracted_content: extractedText
          };
          setFiles(prev => [...prev, mockFile]);
          setIsUploading(false);
      }, 1500);
    }
  };

  const verifyEvidenceWithAI = async (clause: any, file: VaultFile) => {
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const model = "gemini-3-flash-preview";
          
          const prompt = `
          Role: Government Procurement Compliance Auditor.
          Task: Determine if the provided EVIDENCE text satisfies the CLAUSE requirement.
          
          CLAUSE REQUIREMENT: "${clause.text}"
          
          EVIDENCE CONTENT (Extracted from ${file.filename}): 
          "${file.extracted_content}"
          
          Instructions:
          1. Check for specific keywords (e.g., "ONVIF", "India", "$500M", "ISO 27001").
          2. If the evidence is generic or misses the key requirement, Mark Verified = False.
          3. Provide a concise reason (under 15 words).
          `;

          const response = await ai.models.generateContent({
              model: model,
              contents: prompt,
              config: { 
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          verified: { type: Type.BOOLEAN },
                          reason: { type: Type.STRING }
                      },
                      required: ["verified", "reason"]
                  }
              }
          });

          const result = JSON.parse(response.text || '{}');
          return { ...result, analyzed_text: file.extracted_content };

      } catch (error) {
          console.error("AI Verify Error", error);
          return { verified: false, reason: "AI Service Unavailable", analyzed_text: "N/A" };
      }
  };

  const handleMapEvidence = async (fileId: string) => {
    if (!selectedClause) return;
    const clauseId = selectedClause;
    const clause = mockClauses.find(c => c.id === clauseId);
    const file = files.find(f => f.id === fileId);

    if (!clause || !file) return;

    // Set UI to verifying state
    setMappings(prev => ({ ...prev, [clauseId]: fileId }));
    setVerifying(prev => ({ ...prev, [clauseId]: true }));

    // Execute AI Verification
    const result = await verifyEvidenceWithAI(clause, file);

    setVerificationResults(prev => ({ ...prev, [fileId]: result }));
    
    // Update file verified status globally if it passes
    if (result.verified) {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, verified: true } : f));
    }

    setVerifying(prev => ({ ...prev, [clauseId]: false }));
  };

  const handleGenerateManifest = async () => {
      try {
          setManifestData({
              manifest: {
                  manifest_id: "MANIFEST-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
                  generated_at: new Date().toISOString(),
                  artifacts: files.filter(f => Object.values(mappings).includes(f.id)).map(f => ({
                      filename: f.filename,
                      sha256: f.file_sha256,
                      verification_status: f.verified ? "PASS" : "FAIL",
                      ai_reason: verificationResults[f.id]?.reason || "N/A"
                  }))
              },
              signing_instructions: "Backend unreachable. Local simulation active.",
              signature: "SIMULATED_RSA_SHA256"
          });
          setShowManifestModal(true);
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="h-full flex flex-col fade-in text-slate-200">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-slate-900 p-4 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white font-header flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400">lock_person</span>
            Evidence Vault
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>VAULT ID: VLT-8821-X</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              REGION: ap-south-1
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowKeysModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-medium transition-colors text-slate-300"
          >
            View Public Keys
          </button>
          <button 
            onClick={handleConnectWallet}
            disabled={walletConnected}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 ${
              walletConnected 
                ? 'bg-green-900/30 border border-green-500 text-green-400' 
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{walletConnected ? 'link' : 'wallet'}</span>
            {walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0">
        
        {/* Left: Upload & Files */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded bg-slate-900/50">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Secure Upload</h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded cursor-pointer hover:bg-slate-800 hover:border-teal-500 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <span className="material-symbols-outlined animate-spin text-3xl text-teal-400">autorenew</span>
                ) : (
                  <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">cloud_upload</span>
                )}
                <p className="text-xs text-slate-400">
                  {isUploading ? 'Encrypting & OCR Processing...' : 'Click to upload PDF / IMG'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Auto-Tagging & Versioning Active</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="flex-1 glass-panel p-0 rounded overflow-hidden flex flex-col bg-slate-900/50 min-h-[300px]">
            <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
               <span className="font-bold text-xs text-slate-300">Artifacts ({files.length})</span>
               <span className="text-[10px] text-slate-500">SHA-256 Protected</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {files.length === 0 && (
                <p className="text-center text-slate-600 text-xs mt-10">No artifacts in vault.</p>
              )}
              {files.map(file => (
                <div key={file.id} className="p-3 bg-slate-800 rounded border border-slate-700 relative group transition-colors hover:border-slate-500">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                         <p className="text-xs font-bold text-white truncate max-w-[150px]">{file.filename}</p>
                         <p className="text-[10px] text-teal-500 font-mono">v{file.version} • {(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                     <div className={`w-2 h-2 rounded-full ${file.verified ? 'bg-green-500' : 'bg-slate-600'}`} title={file.verified ? 'Verified' : 'Unverified'}></div>
                  </div>
                  
                  <div className="flex gap-1 flex-wrap mb-2">
                      {file.tags && file.tags.map(tag => (
                          <span key={tag} className="text-[9px] bg-slate-700 px-1.5 rounded text-slate-300 border border-slate-600">{tag}</span>
                      ))}
                  </div>

                  <div className="flex justify-between items-end">
                      <div className="text-[9px] text-slate-500 font-mono" title={file.file_sha256}>
                          SHA: {file.file_sha256 ? file.file_sha256.substring(0, 12) + "..." : "Calculating..."}
                      </div>
                      
                      {selectedClause && (
                       <button 
                         onClick={() => handleMapEvidence(file.id)}
                         className="text-[10px] bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded shadow-sm"
                       >
                         Map to Clause
                       </button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Clause Mapping */}
        <div className="col-span-8 glass-panel p-0 rounded overflow-hidden flex flex-col bg-slate-900/50 border-slate-700">
          <div className="p-4 border-b border-slate-700 bg-navy-900 flex justify-between items-center">
            <h3 className="font-bold text-white">Compliance Matrix</h3>
            <span className="text-xs text-slate-400">Select a clause to map evidence</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockClauses.map(clause => {
              const mappedFileId = mappings[clause.id];
              const mappedFile = files.find(f => f.id === mappedFileId);
              const isVerifying = verifying[clause.id];
              const result = mappedFile ? verificationResults[mappedFile.id] : null;

              return (
                <div 
                  key={clause.id} 
                  className={`p-4 rounded border transition-all cursor-pointer ${
                    selectedClause === clause.id 
                      ? 'bg-slate-800 border-teal-500 ring-1 ring-teal-500/50' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedClause(clause.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{clause.title}</h4>
                      <p className="text-xs text-slate-400 mb-2">{clause.text}</p>
                      <div className="inline-block px-2 py-0.5 rounded bg-slate-900 text-[10px] text-slate-500 border border-slate-700">
                        Required: {clause.required_evidence}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-2">
                      {isVerifying ? (
                        <span className="flex items-center gap-1 text-xs text-yellow-400 animate-pulse">
                          <span className="material-symbols-outlined text-sm">hourglass_top</span> Verifying (AI)...
                        </span>
                      ) : mappedFile ? (
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-xs font-bold mb-1 justify-end ${result?.verified ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="material-symbols-outlined text-sm">{result?.verified ? 'verified' : 'cancel'}</span>
                            {result?.verified ? 'Verified' : 'Rejected'}
                          </div>
                          
                          {/* AI Reason */}
                          {result && (
                              <div className="flex flex-col items-end">
                                  <div className={`text-[10px] italic mb-1 ${result.verified ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                      "{result.reason}"
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setExpandedContext(expandedContext === mappedFile.id ? null : mappedFile.id); }}
                                    className="text-[9px] text-teal-500 hover:underline flex items-center gap-1"
                                  >
                                      {expandedContext === mappedFile.id ? 'Hide Context' : 'View Extracted Context'}
                                  </button>
                                  {expandedContext === mappedFile.id && (
                                      <div className="mt-2 p-2 bg-black/50 rounded border border-slate-700 text-[9px] font-mono text-slate-400 max-w-xs whitespace-pre-wrap text-left">
                                          {result.analyzed_text}
                                      </div>
                                  )}
                              </div>
                          )}

                          <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex flex-col items-end mt-1">
                            <span>{mappedFile.filename}</span>
                            <span className="text-slate-600 font-mono text-[9px]">{mappedFile.file_sha256.substring(0,8)}...</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">error</span> Missing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end">
             <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-sm font-bold mr-3 border border-slate-600">
               Save Draft
             </button>
             <button 
               onClick={handleGenerateManifest}
               className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded text-sm font-bold shadow-lg shadow-teal-900/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={Object.keys(mappings).length === 0}
             >
               <span className="material-symbols-outlined text-sm">inventory_2</span>
               Generate Bundle
             </button>
          </div>
        </div>
      </div>

      {/* Keys Modal */}
      {showKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Public Keys</h3>
              <button onClick={() => setShowKeysModal(false)}><span className="material-symbols-outlined text-slate-400">close</span></button>
            </div>
            <div className="p-4 space-y-3">
              {publicKeys.map(k => (
                <div key={k.id} className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs">
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>{k.id}</span>
                    <span>{k.algo}</span>
                  </div>
                  <div className="text-teal-500 break-all">{k.thumb}</div>
                  <div className="mt-2 text-slate-600 text-[10px]">Created: {k.created}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manifest Modal */}
      {showManifestModal && manifestData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-400">inventory_2</span>
                  Evidence Manifest Generated
              </h3>
              <button onClick={() => setShowManifestModal(false)}><span className="material-symbols-outlined text-slate-400">close</span></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300">
               <div className="bg-slate-950 p-4 rounded border border-slate-800 mb-4">
                  <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Manifest ID:</span>
                      <span className="text-white">{manifestData.manifest.manifest_id}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="text-white">{manifestData.manifest.generated_at}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Artifacts:</span>
                      <span className="text-white">{manifestData.manifest.artifacts.length}</span>
                  </div>
               </div>

               <div className="mb-4">
                   <h4 className="text-slate-400 font-bold mb-2 uppercase">Signature Status</h4>
                   <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded flex items-start gap-2 text-yellow-500">
                       <span className="material-symbols-outlined text-lg">warning</span>
                       <div>
                           <p className="font-bold">HSM Signing Unavailable</p>
                           <p className="opacity-80 mt-1">{manifestData.signing_instructions}</p>
                           <p className="mt-2 font-mono text-[10px] break-all bg-black/30 p-1 rounded text-slate-400">Sig: {manifestData.signature}</p>
                       </div>
                   </div>
               </div>

               <div>
                   <h4 className="text-slate-400 font-bold mb-2 uppercase">Raw JSON Preview</h4>
                   <pre className="bg-black p-4 rounded border border-slate-800 overflow-x-auto text-green-500">
                       {JSON.stringify(manifestData.manifest, null, 2)}
                   </pre>
               </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/50">
                <button 
                  className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded text-sm font-bold shadow-lg"
                  onClick={() => alert("Downloading package.zip (Simulated)")}
                >
                    Download Package
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Vault;