import React, { useState, useEffect } from 'react';
import { CalculatorItem } from '../types';

const Calculator: React.FC = () => {
  const [items, setItems] = useState<CalculatorItem[]>([
    { id: '1', name: 'Ruggedized PCB Mainboard', hsCode: '8542.31', importCost: 15000, localCost: 5000 },
    { id: '2', name: 'Chassis & Housing (Metal)', hsCode: '7326.90', importCost: 0, localCost: 8000 },
    { id: '3', name: 'LCD Panel (10 inch)', hsCode: '8524.30', importCost: 12000, localCost: 0 },
    { id: '4', name: 'Assembly & Testing Services', hsCode: '9988', importCost: 0, localCost: 18000 },
  ]);

  const [localContentPercent, setLocalContentPercent] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalLocal, setTotalLocal] = useState(0);
  const [totalImport, setTotalImport] = useState(0);

  useEffect(() => {
    let tImport = 0;
    let tLocal = 0;

    items.forEach(item => {
      tImport += item.importCost || 0;
      tLocal += item.localCost || 0;
    });

    const total = tImport + tLocal;
    const percent = total > 0 ? (tLocal / total) * 100 : 0;
    
    setTotalImport(tImport);
    setTotalLocal(tLocal);
    setTotalCost(total);
    setLocalContentPercent(percent);
  }, [items]);

  const updateItem = (id: string, field: 'importCost' | 'localCost', value: string) => {
    const numValue = parseFloat(value) || 0;
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = () => {
    const newId = (Math.max(...items.map(i => parseInt(i.id))) + 1).toString();
    setItems([...items, { id: newId, name: 'New Component', hsCode: '0000', importCost: 0, localCost: 0 }]);
  };

  // STRICT 50.1% LOGIC FOR CLASS-I
  let statusColor = 'text-red-400';
  let statusBorder = 'border-red-500';
  let progressColor = 'bg-red-500';
  let statusTitle = 'Non-Local Supplier';
  let statusDesc = 'Local Content is below 20%. Not eligible for MII preference.';

  if (localContentPercent >= 50.1) {
    statusColor = 'text-teal-400';
    statusBorder = 'border-teal-500';
    progressColor = 'bg-teal-500';
    statusTitle = 'Class-I Local Supplier';
    statusDesc = 'Eligible for Purchase Preference (Top Priority). Content > 50.1%.';
  } else if (localContentPercent >= 20.0) {
    statusColor = 'text-yellow-500';
    statusBorder = 'border-yellow-500';
    progressColor = 'bg-yellow-500';
    statusTitle = 'Class-II Local Supplier';
    statusDesc = 'Eligible to bid, but NO Purchase Preference. Content > 20%.';
  }

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-white font-header">MII Calculator</h2>
           <p className="text-xs text-slate-500">Public Procurement (Preference to Make in India) Order 2017</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Controls */}
        <div className="lg:col-span-8 glass-panel rounded overflow-hidden flex flex-col bg-slate-900/50">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-500 text-xs uppercase sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-4 font-semibold">Item Description</th>
                  <th className="p-4 font-semibold">HS Code</th>
                  <th className="p-4 text-right font-semibold">Import (₹)</th>
                  <th className="p-4 text-right font-semibold">Local (₹)</th>
                  <th className="p-4 text-center font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium text-slate-300 min-w-[200px]">{item.name}</td>
                    <td className="p-4 text-slate-500 font-mono">{item.hsCode}</td>
                    <td className="p-4 text-right">
                      <input 
                        type="number" 
                        value={item.importCost} 
                        onChange={(e) => updateItem(item.id, 'importCost', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-sm w-28 p-1.5 text-right text-white focus:border-teal-500 outline-none font-mono"
                      />
                    </td>
                    <td className="p-4 text-right">
                      <input 
                        type="number" 
                        value={item.localCost} 
                        onChange={(e) => updateItem(item.id, 'localCost', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-sm w-28 p-1.5 text-right text-white focus:border-teal-500 outline-none font-mono"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-slate-700 bg-slate-800/50">
            <button 
              onClick={addItem}
              className="text-teal-400 text-xs flex items-center gap-2 hover:text-teal-300 font-bold uppercase tracking-wide"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add Line Item
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded text-center bg-slate-900/50">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-4 font-bold">Local Content</p>
            
            <div className="relative mb-6">
                <div className="h-4 bg-slate-800 rounded-full w-full overflow-hidden">
                    <div className={`h-full ${progressColor} transition-all duration-700 ease-out`} style={{width: `${Math.min(localContentPercent, 100)}%`}}></div>
                </div>
                <div className="absolute top-6 left-0 right-0 flex justify-between text-[10px] text-slate-600 font-mono pt-1">
                    <span>0%</span>
                    <span>20% (C-II)</span>
                    <span>50.1% (C-I)</span>
                    <span>100%</span>
                </div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-3 py-1 rounded shadow-md">
                    <span className={`text-2xl font-mono font-bold ${statusColor}`}>
                        {localContentPercent.toFixed(1)}%
                    </span>
                </div>
            </div>
            
             {/* Formula Breakdown */}
            <div className="mt-8 pt-4 border-t border-slate-800 text-sm text-left space-y-3">
                <div className="flex justify-between">
                    <span className="text-slate-500">Total Local:</span>
                    <span className="text-white font-mono">₹{totalLocal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Total Import:</span>
                    <span className="text-white font-mono">₹{totalImport.toLocaleString()}</span>
                </div>
                 <div className="flex justify-between border-t border-slate-700 pt-2">
                    <span className="text-slate-400 font-bold">Total Value:</span>
                    <span className="text-teal-400 font-mono font-bold">₹{totalCost.toLocaleString()}</span>
                </div>
            </div>
          </div>

          <div className={`glass-panel p-4 rounded border-l-4 ${statusBorder} bg-slate-900/50`}>
            <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined ${statusColor} text-2xl`}>
                    {localContentPercent >= 50.1 ? 'verified' : localContentPercent >= 20 ? 'warning' : 'error'}
                </span>
                <div>
                    <h3 className="font-bold text-white">{statusTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{statusDesc}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;