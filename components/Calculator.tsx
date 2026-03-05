import React, { useState, useEffect } from 'react';

interface BOMItemData {
  name: string;
  hs_code: string;
  quantity: number;
  unit_price_local: number;
  unit_price_import: number;
}

const Calculator: React.FC = () => {
  // Mode: Manual or File
  const [isSimulating, setIsSimulating] = useState(false);
  const [items, setItems] = useState<BOMItemData[]>([]);
  const [uploadData, setUploadData] = useState<any>(null); // To store calc metadata
  const [projectedLC, setProjectedLC] = useState<number>(0);
  const [projectedPWin, setProjectedPWin] = useState<number>(0);
  const [recommendation, setRecommendation] = useState<string>('');
  const [topOffenderIndex, setTopOffenderIndex] = useState<number>(-1);

  // Manual fallback state if not using file
  const [localContentPercent, setLocalContentPercent] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalLocal, setTotalLocal] = useState(0);
  const [totalImport, setTotalImport] = useState(0);

  // Simulation State
  const [simTotalCost, setSimTotalCost] = useState(0);
  const [simTotalLocal, setSimTotalLocal] = useState(0);
  const [simTotalImport, setSimTotalImport] = useState(0);

  // --- Logic Helpers ---
  // calculateMetrics moved to coreProcessingEngine


  const processCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/);
    const parsedItems: BOMItemData[] = [];
    
    // Simple heuristic: Skip header if first line contains text keys
    let startIndex = 0;
    if (lines[0] && (lines[0].toLowerCase().includes('item') || lines[0].toLowerCase().includes('name'))) {
        startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Assuming Standard CSV: Name, HS, Qty, LocalPrice, ImportPrice
        const parts = line.split(','); 
        
        if (parts.length >= 5) {
            const name = parts[0].replace(/"/g, '');
            const hs = parts[1].replace(/"/g, '');
            const qty = parseFloat(parts[2]);
            const localPrice = parseFloat(parts[3]);
            const importPrice = parseFloat(parts[4]);

            if (!isNaN(qty)) {
                parsedItems.push({
                    name,
                    hs_code: hs,
                    quantity: qty,
                    unit_price_local: localPrice || 0,
                    unit_price_import: importPrice || 0
                });
            }
        }
    }
    return parsedItems;
  };

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
            const parsed = processCSV(text);
            if (parsed.length === 0) throw new Error("No valid items found");
            
            updateStateWithItems(parsed, file.name);
        } catch (err) {
            alert("Error parsing CSV. Format required: Name, HS Code, Qty, Local Price, Import Price");
        }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
      const sampleCSV = `Mainboard PCB,8542.31,10,15000,500
LCD Display Panel,8524.30,10,0,12000
Rugged Metal Chassis,7326.90,10,8000,0
Power Supply Unit,8504.40,10,2500,2500
Cable Assembly,8544.42,50,500,0`;
      
      const parsed = processCSV(sampleCSV);
      updateStateWithItems(parsed, "DEMO_BOM_DATA");
  };

  const updateStateWithItems = async (newItems: BOMItemData[], sourceName: string) => {
      setItems(newItems);
      
      const { coreEngine } = await import('../services/coreProcessingEngine');
      const result = await coreEngine.processL1Calculation(newItems);
      
      if (result.success && result.data) {
          const metrics = result.data;
          setTotalCost(metrics.totalCost);
          setTotalLocal(metrics.totalLocal);
          setTotalImport(metrics.totalImport);
          setLocalContentPercent(metrics.lcPercent);
          
          // Initialize simulation state matching actuals
          setProjectedLC(metrics.lcPercent);
          setProjectedPWin(metrics.pWin);
          setRecommendation(metrics.rec);
          setTopOffenderIndex(metrics.maxImportIdx);
          
          setSimTotalCost(metrics.totalCost);
          setSimTotalLocal(metrics.totalLocal);
          setSimTotalImport(metrics.totalImport);

          setUploadData({
              id: "CALC-" + Math.floor(Math.random() * 10000),
              file_sha256: "CLIENT_SIDE_HASH_" + sourceName,
              provenance: sourceName
          });
      }
  };

  // When sliders/inputs change in simulator
  const handleSimChange = async (index: number, field: 'unit_price_local' | 'unit_price_import', val: number) => {
      const newItems = [...items];
      if (val < 0) val = 0;
      newItems[index][field] = val;
      setItems(newItems);
      
      recalculateSimulation(newItems);
  };

  const handleIndigenize = (index: number) => {
      const newItems = [...items];
      const item = newItems[index];
      // Move all Import Value to Local Value
      item.unit_price_local += item.unit_price_import;
      item.unit_price_import = 0;
      
      setItems(newItems);
      recalculateSimulation(newItems);
  };

  const recalculateSimulation = async (newItems: BOMItemData[]) => {
      const { coreEngine } = await import('../services/coreProcessingEngine');
      const result = await coreEngine.processL1Calculation(newItems);
      
      if (result.success && result.data) {
          const metrics = result.data;
          setProjectedLC(metrics.lcPercent);
          setProjectedPWin(metrics.pWin);
          setRecommendation(metrics.rec);
          setTopOffenderIndex(metrics.maxImportIdx);
          
          setSimTotalCost(metrics.totalCost);
          setSimTotalLocal(metrics.totalLocal);
          setSimTotalImport(metrics.totalImport);
      }
  };

  const downloadCertificate = async () => {
      const { coreEngine } = await import('../services/coreProcessingEngine');
      // We need to re-calculate to get the exact numbers for the certificate if in simulation mode
      // Or just use the state. But to be safe and consistent with "using the engine", let's use the engine.
      // However, `downloadCertificate` is synchronous UI logic mostly. 
      // The prompt says "Refactor backend processing pipeline". 
      // I will keep the certificate generation logic here but use the engine for the numbers if needed.
      // Actually, we already have the numbers in state (`projectedLC`, `totalCost`, etc).
      // So we don't strictly need to call the engine again here, but the original code called `calculateMetrics` inside `downloadCertificate`.
      
      let tCost = totalCost;
      let tLocal = totalLocal;
      
      if (isSimulating) {
           const result = await coreEngine.processL1Calculation(items);
           if (result.success && result.data) {
               tCost = result.data.totalCost;
               tLocal = result.data.totalLocal;
           }
      }

      const currentLC = isSimulating ? projectedLC : localContentPercent;
      const status = currentLC >= 50 ? 'Class-I Local Supplier' : currentLC >= 20 ? 'Class-II Local Supplier' : 'Non-Local Supplier';
      const content = `
SELF-CERTIFICATION UNDER PUBLIC PROCUREMENT (PREFERENCE TO MAKE IN INDIA), ORDER 2017

Reference: ${uploadData?.id || 'DRAFT'}
Date: ${new Date().toLocaleDateString()}

I/We hereby certify that the local content in the offered item is ${currentLC.toFixed(2)}%.
We strictly categorize ourselves as: ${status}.

Breakdown:
Total Cost: ₹${tCost.toLocaleString()}
Total Local Value: ₹${tLocal.toLocaleString()}

(This is a system generated draft for internal assessment.)
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MII_Certificate_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
  };

  // Determine status styles
  let statusColor = 'text-red-400';
  let statusBorder = 'border-red-500';
  let gaugeColor = '#ef4444';
  let statusTitle = 'Non-Local Supplier';
  let statusDesc = 'Local Content is below 20%. Not eligible for MII preference.';

  const currentPercent = isSimulating ? projectedLC : localContentPercent;

  if (currentPercent >= 50.0) {
    statusColor = 'text-teal-400';
    statusBorder = 'border-teal-500';
    gaugeColor = '#0d9488';
    statusTitle = 'Class-I Local Supplier';
    statusDesc = 'Eligible for Purchase Preference (Top Priority). Content > 50%.';
  } else if (currentPercent >= 20.0) {
    statusColor = 'text-yellow-500';
    statusBorder = 'border-yellow-500';
    gaugeColor = '#eab308';
    statusTitle = 'Class-II Local Supplier';
    statusDesc = 'Eligible to bid, but NO Purchase Preference. Content > 20%.';
  }

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-white font-header">MII Calculator & Simulator</h2>
           <p className="text-xs text-slate-500">Public Procurement (Preference to Make in India) Order 2017</p>
        </div>
        <div className="flex gap-2">
            {!uploadData && (
                <button 
                    onClick={loadSampleData}
                    className="px-4 py-2 rounded text-xs font-bold bg-slate-800 text-cyan-400 border border-cyan-900/50 hover:bg-slate-700 transition-colors"
                >
                    Load Demo Data
                </button>
            )}
            <button 
                onClick={() => setIsSimulating(!isSimulating)}
                disabled={!uploadData}
                className={`px-4 py-2 rounded text-xs font-bold transition-all ${
                    !uploadData 
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : isSimulating 
                            ? 'bg-purple-600 text-white animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
            >
                {isSimulating ? 'Exit Simulation' : 'Launch Sensitivity Simulator'}
            </button>
            <label className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-xs font-bold cursor-pointer transition-colors shadow-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Upload BOM (CSV)
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
        </div>
      </div>
      
      {uploadData && (
          <div className="bg-slate-900/50 p-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 flex justify-between items-center">
              <span>SOURCE: {uploadData.provenance}</span>
              <span className="flex items-center gap-2">
                  ID: {uploadData.id}
                  {isSimulating && <span className="text-purple-400 font-bold px-2 py-0.5 bg-purple-900/20 rounded">SIMULATION ACTIVE</span>}
              </span>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Controls */}
        <div className="lg:col-span-8 glass-panel rounded overflow-hidden flex flex-col bg-slate-900/50">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-500 text-xs uppercase sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-4 font-semibold">Item Description</th>
                  <th className="p-4 font-semibold">HS Code</th>
                  <th className="p-4 text-right font-semibold">Qty</th>
                  <th className="p-4 text-right font-semibold">Local Unit ($)</th>
                  <th className="p-4 text-right font-semibold">Import Unit ($)</th>
                  {isSimulating && <th className="p-4 text-center font-semibold">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500">
                            <div className="flex flex-col items-center gap-3">
                                <span className="material-symbols-outlined text-4xl opacity-30">table_view</span>
                                <p>Upload a BOM CSV or click "Load Demo Data" to begin.</p>
                            </div>
                        </td>
                    </tr>
                )}
                {items.map((item, i) => (
                  <tr key={i} className={`hover:bg-slate-800/50 transition-colors ${i === topOffenderIndex && isSimulating ? 'bg-red-900/10' : ''}`}>
                    <td className="p-4 font-medium text-slate-300 min-w-[200px]">
                        {item.name}
                        {i === topOffenderIndex && isSimulating && (
                            <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                Max Import
                            </span>
                        )}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{item.hs_code}</td>
                    <td className="p-4 text-right text-slate-400">{item.quantity}</td>
                    <td className="p-4 text-right">
                      {isSimulating ? (
                          <input 
                            type="number"
                            value={item.unit_price_local}
                            onChange={(e) => handleSimChange(i, 'unit_price_local', parseFloat(e.target.value))}
                            className="bg-slate-800 border border-teal-500/50 rounded w-24 text-right text-teal-300 p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                      ) : (
                          <span className="text-teal-400 font-mono">{item.unit_price_local.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                       {isSimulating ? (
                          <input 
                            type="number"
                            value={item.unit_price_import}
                            onChange={(e) => handleSimChange(i, 'unit_price_import', parseFloat(e.target.value))}
                            className="bg-slate-800 border border-red-500/50 rounded w-24 text-right text-red-300 p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                      ) : (
                          <span className="text-red-400 font-mono">{item.unit_price_import.toLocaleString()}</span>
                      )}
                    </td>
                    {isSimulating && (
                        <td className="p-4 text-center">
                            {item.unit_price_import > 0 ? (
                                <button 
                                    onClick={() => handleIndigenize(i)}
                                    title="Convert to 100% Local (Simulate)"
                                    className="text-cyan-400 hover:text-white hover:bg-cyan-600/50 p-1.5 rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">change_circle</span>
                                </button>
                            ) : (
                                <span className="text-slate-600 material-symbols-outlined text-lg">check_circle</span>
                            )}
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`glass-panel p-6 rounded text-center bg-slate-900/50 ${isSimulating ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.2)]' : ''}`}>
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
                    {isSimulating ? 'SIMULATION' : 'ACTUALS'}
                </p>
                {isSimulating && (
                    <button 
                        onClick={() => updateStateWithItems(items, "RESET")}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                        Reset
                    </button>
                )}
            </div>
            
            <div className="relative mb-6 pt-4">
                {/* Gauge Background */}
                <svg className="w-full h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
                    {/* Class-I Threshold Marker */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="10" strokeDasharray="1 282" strokeDashoffset="-141" className="opacity-50" />
                    
                    <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke={gaugeColor} 
                        strokeWidth="10" 
                        strokeDasharray={`${Math.min(currentPercent, 100) * 2.83} 283`}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-mono font-bold ${statusColor} drop-shadow-md`}>
                        {currentPercent.toFixed(1)}%
                    </span>
                    {isSimulating && (
                        <span className="text-[10px] text-purple-400 font-bold mt-1 uppercase tracking-wide">Projected</span>
                    )}
                </div>
            </div>
            
            {isSimulating && (
                 <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded text-left relative overflow-hidden">
                     <div className="flex justify-between items-center mb-1 relative z-10">
                         <span className="text-xs text-purple-300 font-bold">P-Win Probability</span>
                         <span className="text-lg font-bold text-white">{(projectedPWin).toFixed(0)}%</span>
                     </div>
                     <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative z-10">
                         <div className="bg-purple-500 h-full transition-all duration-500" style={{width: `${projectedPWin}%`}}></div>
                     </div>
                     <p className="text-[9px] text-slate-400 mt-2 leading-snug relative z-10">
                         {recommendation}
                     </p>
                 </div>
            )}

             {/* Formula Breakdown */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-left space-y-3 font-mono">
                <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Local Value:</span>
                    <span className="text-teal-400">₹{(isSimulating ? simTotalLocal : totalLocal).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Import Value:</span>
                    <span className="text-red-400">₹{(isSimulating ? simTotalImport : totalImport).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                 <div className="flex justify-between border-t border-slate-700 pt-2 text-white">
                    <span className="text-slate-400 font-sans font-bold">Total Project Cost:</span>
                    <span className="font-bold">₹{(isSimulating ? simTotalCost : totalCost).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
            </div>
          </div>

          <div className={`glass-panel p-4 rounded border-l-4 ${statusBorder} bg-slate-900/50 transition-colors duration-500`}>
            <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined ${statusColor} text-2xl`}>
                    {currentPercent >= 50.0 ? 'verified' : currentPercent >= 20 ? 'warning' : 'error'}
                </span>
                <div>
                    <h3 className="font-bold text-white text-sm">{statusTitle}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{statusDesc}</p>
                </div>
            </div>
          </div>
          
          {uploadData && (
             <div className="grid grid-cols-2 gap-2">
                 {isSimulating ? (
                     <button 
                        onClick={downloadCertificate}
                        className="col-span-2 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                     >
                         <span className="material-symbols-outlined text-sm">download</span>
                         Download Projection Cert
                     </button>
                 ) : (
                     <>
                        <button className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Request Auditor
                        </button>
                        <button 
                            onClick={downloadCertificate}
                            className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold text-teal-400 flex items-center justify-center gap-2 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Export
                        </button>
                     </>
                 )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;