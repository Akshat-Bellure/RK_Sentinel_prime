import React, { useState } from 'react';
import { computeSHA256 } from '../utils/crypto';
import { Tender } from '../types';

const IngestStation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'api'>('manual');
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncedItems, setSyncedItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    refId: '',
    value: '',
    category: 'Goods'
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileHash(''); // Reset previous hash
      setIsHashing(true);
      setIngestSuccess(null);

      try {
        const hash = await computeSHA256(selectedFile);
        setFileHash(hash);
      } catch (err) {
        console.error("Hashing failed", err);
        alert("Error calculating file hash. Please try again.");
      } finally {
        setIsHashing(false);
      }
    }
  };

  const handleManualUpload = async () => {
    if (!file || !formData.refId || !fileHash) return;
    setIsUploading(true);
    setIngestSuccess(null);

    // Get User ID from auth context or storage
    const userId = localStorage.getItem('user_id') || 'USER-TEMP-001';
    const token = localStorage.getItem('token') || 'mock-token';

    try {
        const { coreEngine } = await import('../services/coreProcessingEngine');
        
        const result = await coreEngine.processIngest({
            file,
            refId: formData.refId,
            title: formData.title,
            category: formData.category,
            value: formData.value,
            userId,
            token
        });

        if (result.success && result.data) {
             setIngestSuccess(`Successfully Ingested via API! ID: ${result.data.id}`);
             resetForm();
        } else {
            throw new Error(result.error);
        }

    } catch (e) {
        console.warn("Backend unavailable or failed, processing locally.");
        setIsOfflineMode(true);
        
        // Simulation / Local Persistence
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create a Tender object compliant with Dashboard types
        const valNum = parseFloat(formData.value) || 0;
        const newTender: Tender = {
            id: `MANUAL-${Date.now()}`,
            ref: formData.refId,
            title: formData.title,
            due: '30 Days',
            value: `₹${(valNum / 10000000).toFixed(2)} Cr`,
            valueNum: valNum / 10000000,
            tag: 'MANUAL ENTRY',
            tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            risk: false,
            category: formData.category as any,
            state: 'New Delhi', // Default for manual
            isVerified: false,
            location: { lat: 28.6139, lng: 77.2090 }, // Default location
            pwin: 50 // Base probability
        };

        // Save to Local Storage for Dashboard to pick up
        const existing = localStorage.getItem('sentinel_tenders');
        const tenders = existing ? JSON.parse(existing) : [];
        tenders.unshift(newTender);
        localStorage.setItem('sentinel_tenders', JSON.stringify(tenders));

        setIngestSuccess(`Ingested Locally (Offline Mode). Tender added to Dashboard.`);
        resetForm();
    } finally {
        setIsUploading(false);
    }
  };

  const resetForm = () => {
      setFile(null);
      setFileHash('');
      setFormData({ title: '', refId: '', value: '', category: 'Goods' });
  };

  const handleApiSync = async () => {
    setSyncStatus('SYNCING');
    try {
        const token = localStorage.getItem('token') || 'mock-token';
        const res = await fetch('http://localhost:8080/api/v1/tenders/sync?source=GEM', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) throw new Error('Backend Unreachable');

        const data = await res.json();
        setSyncedItems(data.data || []);
        setSyncStatus('COMPLETE');
    } catch (e) {
        console.warn("Sync failed, using mock data.");
        setIsOfflineMode(true);
        // Fallback Mock Data
        setTimeout(() => {
            setSyncedItems([
                { source_ref_id: "GEM/2024/SIM/001", title: "Simulated: Advanced Drone Defense System", value_inr: 45000000, is_verified: true },
                { source_ref_id: "CPPP/2024/SIM/002", title: "Simulated: Network Infrastructure Upgrade", value_inr: 12000000, is_verified: false },
                { source_ref_id: "GEM/2024/SIM/003", title: "Simulated: Annual Maintenance for HQ", value_inr: 500000, is_verified: true }
            ]);
            setSyncStatus('COMPLETE');
        }, 1500);
    }
  };

  const loadDemoData = async () => {
    setFormData({
        title: 'AI-Enabled Perimeter Surveillance System for Eastern Command',
        refId: 'GEM/2025/B/998210',
        value: '25000000',
        category: 'Goods'
    });
    // Create a dummy file object for simulation
    const dummyFile = new File(["dummy content"], "tender_spec_v1.pdf", { type: "application/pdf" });
    setFile(dummyFile);
    setIsHashing(true);
    const hash = await computeSHA256(dummyFile);
    setFileHash(hash);
    setIsHashing(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-white font-header flex items-center gap-2">
             <span className="material-symbols-outlined text-teal-400">input</span>
             Ingest Station
           </h2>
           <p className="text-xs text-slate-500">Manual Entry & API Sync Gateway</p>
        </div>
        <div className="flex gap-2 items-center">
            {isOfflineMode && (
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded font-bold mr-2">
                    OFFLINE MODE
                </span>
            )}
            <button 
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 rounded text-xs font-bold transition-colors ${activeTab === 'manual' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                Manual Upload
            </button>
            <button 
                onClick={() => setActiveTab('api')}
                className={`px-4 py-2 rounded text-xs font-bold transition-colors ${activeTab === 'api' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                API Feed Sync
            </button>
        </div>
      </div>

      {activeTab === 'manual' ? (
        <div className="glass-panel p-6 rounded max-w-2xl mx-auto w-full bg-slate-900/50">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-white">Manual Tender Entry</h3>
               <button 
                    onClick={loadDemoData}
                    className="px-3 py-1.5 rounded text-xs font-bold bg-slate-800 text-cyan-400 border border-cyan-900/50 hover:bg-slate-700 transition-colors"
                >
                    Load Demo Data
                </button>
           </div>
           
           <div className="space-y-4">
               {ingestSuccess && (
                   <div className="p-3 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-2 text-green-400 text-xs font-bold animate-pulse">
                       <span className="material-symbols-outlined text-lg">check_circle</span>
                       {ingestSuccess}
                   </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                       <label className="text-xs text-slate-400 font-bold uppercase">Reference ID</label>
                       <input 
                          type="text" 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-teal-500 outline-none"
                          placeholder="e.g. GEM/2024/B/..."
                          value={formData.refId}
                          onChange={e => setFormData({...formData, refId: e.target.value})}
                       />
                   </div>
                   <div className="space-y-1">
                       <label className="text-xs text-slate-400 font-bold uppercase">Estimated Value (INR)</label>
                       <input 
                          type="text" 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-teal-500 outline-none"
                          placeholder="e.g. 5000000"
                          value={formData.value}
                          onChange={e => setFormData({...formData, value: e.target.value})}
                       />
                   </div>
               </div>
               
               <div className="space-y-1">
                   <label className="text-xs text-slate-400 font-bold uppercase">Category</label>
                   <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-teal-500 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                   >
                       <option value="Goods">Goods</option>
                       <option value="Services">Services</option>
                       <option value="Works">Works</option>
                   </select>
               </div>

               <div className="space-y-1">
                   <label className="text-xs text-slate-400 font-bold uppercase">Tender Title</label>
                   <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-teal-500 outline-none"
                      placeholder="Title of the tender..."
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                   />
               </div>

               <div className="space-y-1">
                   <label className="text-xs text-slate-400 font-bold uppercase">Tender Document (PDF)</label>
                   <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800/50 hover:border-teal-500 transition-colors cursor-pointer relative group">
                       <input 
                          type="file" 
                          accept="application/pdf,image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={handleFileSelect}
                       />
                       {isHashing ? (
                           <span className="material-symbols-outlined text-4xl mb-2 animate-spin text-teal-500">sync_lock</span>
                       ) : file ? (
                           <span className="material-symbols-outlined text-4xl mb-2 text-teal-500">check_circle</span>
                       ) : (
                           <span className="material-symbols-outlined text-4xl mb-2 group-hover:text-teal-400 transition-colors">cloud_upload</span>
                       )}
                       
                       <p className="text-sm font-medium">
                           {isHashing ? "Calculating SHA-256 Hash..." : file ? file.name : "Drag & Drop or Click to Upload"}
                       </p>
                       
                       {fileHash && !isHashing && (
                           <p className="text-[10px] font-mono text-slate-500 mt-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                               SHA256: {fileHash.substring(0, 16)}...
                           </p>
                       )}
                   </div>
               </div>
               
               <div className="pt-4 border-t border-slate-800">
                   <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded mb-4 flex items-start gap-2">
                       <span className="material-symbols-outlined text-yellow-500 text-lg mt-0.5">warning</span>
                       <div className="text-xs text-yellow-500">
                           <strong>Note:</strong> Manual uploads are marked as <u>UNVERIFIED</u> until approved by a human operator or matched with an API feed.
                       </div>
                   </div>
                   <button 
                       onClick={handleManualUpload}
                       disabled={!file || !formData.refId || isUploading || isHashing}
                       className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                   >
                       {isUploading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                       {isUploading ? 'Ingesting...' : 'Secure Ingest'}
                   </button>
               </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-4 rounded bg-slate-900/50 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">GeM Portal API</p>
                            <h3 className="text-xl font-bold text-white">Connected</h3>
                        </div>
                        <span className="material-symbols-outlined text-green-500">api</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">Status: ONLINE (200 OK)</p>
                </div>
                <div className="glass-panel p-4 rounded bg-slate-900/50 border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">CPPP XML Feed</p>
                            <h3 className="text-xl font-bold text-white">Degraded</h3>
                        </div>
                        <span className="material-symbols-outlined text-yellow-500">rss_feed</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">Latency &gt; 500ms</p>
                </div>
                 <div className="glass-panel p-4 rounded bg-slate-900/50 border-slate-700 flex items-center justify-center">
                    <button 
                        onClick={handleApiSync}
                        disabled={syncStatus === 'SYNCING'}
                        className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded font-bold uppercase text-sm flex items-center gap-2 shadow-lg"
                    >
                        {syncStatus === 'SYNCING' ? (
                            <span className="material-symbols-outlined animate-spin">sync</span>
                        ) : (
                            <span className="material-symbols-outlined">cloud_sync</span>
                        )}
                        {syncStatus === 'SYNCING' ? 'Syncing...' : 'Sync All Sources'}
                    </button>
                </div>
            </div>

            <div className="glass-panel p-0 rounded overflow-hidden bg-slate-900/50">
                 <div className="p-4 border-b border-slate-700 bg-slate-800/50 font-bold text-xs text-slate-300">
                    Sync Logs & Results
                 </div>
                 <div className="p-4">
                     {syncedItems.length === 0 ? (
                         <div className="text-center text-slate-500 italic py-8">
                             No recent sync data. Click "Sync All Sources" to fetch tenders.
                         </div>
                     ) : (
                         <table className="w-full text-left text-sm">
                             <thead className="text-slate-500 text-xs uppercase border-b border-slate-700">
                                 <tr>
                                     <th className="pb-2">Source Ref</th>
                                     <th className="pb-2">Title</th>
                                     <th className="pb-2">Value</th>
                                     <th className="pb-2">Status</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800">
                                 {syncedItems.map((item, i) => (
                                     <tr key={i} className="group hover:bg-slate-800/50">
                                         <td className="py-3 font-mono text-xs text-teal-400">{item.source_ref_id}</td>
                                         <td className="py-3 text-slate-200">{item.title}</td>
                                         <td className="py-3 text-slate-400">₹{item.value_inr.toLocaleString()}</td>
                                         <td className="py-3">
                                             <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${item.is_verified ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                 {item.is_verified ? 'Verified' : 'Pending'}
                                             </span>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     )}
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default IngestStation;