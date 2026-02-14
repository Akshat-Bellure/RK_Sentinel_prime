import React, { useState, useEffect } from 'react';

// Mock Data for Clauses (In prod, fetch from API)
const mockClauses = [
  { id: 'c1', title: '4.1 Video Management', text: 'VMS shall support ONVIF Profile S and G.', required_evidence: 'Datasheet' },
  { id: 'c2', title: '4.2 Hosting Locality', text: 'Data must be hosted in India (MeitY Empanelled).', required_evidence: 'Self-Declaration' },
  { id: 'c3', title: '4.4 OEM Turnover', text: 'OEM must have $500M turnover in last 3 FY.', required_evidence: 'Audited Balance Sheet' },
];

interface VaultFile {
  id: string;
  filename: string;
  size: number;
  upload_time: string;
  verified: boolean;
}

const Vault: React.FC = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [publicKeys, setPublicKeys] = useState<any[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedClause, setSelectedClause] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // ClauseID -> FileID
  const [verifying, setVerifying] = useState<Record<string, boolean>>({}); // ClauseID -> boolean

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      // Simulate API Upload
      setTimeout(() => {
        const newFile: VaultFile = {
          id: Math.random().toString(36).substr(2, 9),
          filename: file.name,
          size: file.size,
          upload_time: new Date().toISOString(),
          verified: false
        };
        setFiles(prev => [...prev, newFile]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const handleMapEvidence = (fileId: string) => {
    if (!selectedClause) return;
    setMappings(prev => ({ ...prev, [selectedClause]: fileId }));
    
    // Auto-verify simulation
    setVerifying(prev => ({ ...prev, [selectedClause]: true }));
    setTimeout(() => {
      setVerifying(prev => ({ ...prev, [selectedClause]: false }));
      // Update file verified status for demo
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, verified: true } : f));
    }, 2000);
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
                  {isUploading ? 'Encrypting & Uploading...' : 'Click to upload PDF / IMG'}
                </p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="flex-1 glass-panel p-0 rounded overflow-hidden flex flex-col bg-slate-900/50 min-h-[300px]">
            <div className="p-3 border-b border-slate-700 bg-slate-800/50 font-bold text-xs text-slate-300">
              Artifacts ({files.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {files.length === 0 && (
                <p className="text-center text-slate-600 text-xs mt-10">No artifacts in vault.</p>
              )}
              {files.map(file => (
                <div key={file.id} className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-center group">
                  <div>
                    <p className="text-xs font-medium text-white truncate max-w-[150px]">{file.filename}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • {file.upload_time.split('T')[0]}</p>
                  </div>
                  <div className="flex gap-2">
                     {selectedClause && (
                       <button 
                         onClick={() => handleMapEvidence(file.id)}
                         className="text-[10px] bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded"
                       >
                         Attach
                       </button>
                     )}
                     <div className={`w-2 h-2 rounded-full ${file.verified ? 'bg-green-500' : 'bg-slate-600'}`} title={file.verified ? 'Verified' : 'Unverified'}></div>
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
                          <span className="material-symbols-outlined text-sm">hourglass_top</span> Verifying...
                        </span>
                      ) : mappedFile ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-green-400 font-bold mb-1">
                            <span className="material-symbols-outlined text-sm">verified</span> Verified
                          </div>
                          <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                            {mappedFile.filename}
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
               className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded text-sm font-bold shadow-lg shadow-teal-900/30 flex items-center gap-2"
               disabled={Object.keys(mappings).length < mockClauses.length}
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
    </div>
  );
};

export default Vault;
