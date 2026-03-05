import React, { useState, useEffect } from 'react';
import LegalGateModal from './LegalGateModal';

const LegalQueue: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Demo data defined outside to be reused
  const getDemoTickets = () => [
      {
          id: 'TKT-8821-X',
          clause_id: 'GEM/2025/B/4829 - Clause 4.2',
          title: 'Query: Data Residency Violation',
          author: 'Vikram Malhotra',
          risk: 'CRITICAL',
          citations: ['MeitY Cloud Guidelines 2023', 'DPDP Act 2023 Sec 17'],
          status: 'PENDING'
      },
      {
          id: 'TKT-9932-Y',
          clause_id: 'CPPP/2025/DL/102 - Clause 12.1',
          title: 'Query: Restrictive Payment Terms',
          author: 'Sarah Jenkins',
          risk: 'HIGH',
          citations: ['GFR 2017 Rule 172', 'CVC Circular 03/01/18'],
          status: 'PENDING'
      },
       {
          id: 'TKT-7741-Z',
          clause_id: 'GEM/2025/B/5510 - Clause 8.5',
          title: 'Query: Warranty Period Clarification',
          author: 'Vikram Malhotra',
          risk: 'MEDIUM',
          citations: [],
          status: 'PENDING'
      }
  ];

  const fetchQueue = async () => {
    setLoading(true);
    
    // Retrieve locally persisted tickets (from PreBidStudio submissions)
    const localStore = localStorage.getItem('sentinel_legal_tickets');
    const localTickets = localStore ? JSON.parse(localStore) : [];
    
    // Basic demo data
    const demoTickets = getDemoTickets();

    try {
        const token = localStorage.getItem('token') || 'mock-token'; 
        // Attempt backend fetch
        const res = await fetch('http://localhost:8080/api/v1/legal/queue', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.queue) {
                // Merge backend tickets with local simulation tickets
                // Filter out duplicates if necessary (using ID)
                const backendTickets = data.queue;
                const merged = [...localTickets, ...backendTickets];
                setTickets(merged);
            } else {
                setTickets([...localTickets, ...demoTickets]);
            }
        } else {
            // Backend offline/error -> Use Hybrid (Local + Demo)
            setTickets([...localTickets, ...demoTickets]);
        }
    } catch (e) {
        // Network error -> Use Hybrid (Local + Demo)
        console.warn("Backend not available. Using hybrid local/demo data.");
        setTickets([...localTickets, ...demoTickets]);
    } finally {
        setLoading(false);
    }
  };

  const loadDemoData = () => {
      // Force reload of demo data + local storage
      const localStore = localStorage.getItem('sentinel_legal_tickets');
      const localTickets = localStore ? JSON.parse(localStore) : [];
      setTickets([...localTickets, ...getDemoTickets()]);
      setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (signature: string) => {
    if (!selectedTicket) return;

    try {
        // Simulate backend approval
        // In a real app, this would hit the API. 
        // For simulation, we remove it from the list.
        setTimeout(() => {
             alert(`Ticket Approved Successfully.\nApproval Hash: ${Math.random().toString(36).substring(7).toUpperCase()}`);
             
             // Update UI
             setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
             
             // Also remove from localStorage if it exists there
             const localStore = localStorage.getItem('sentinel_legal_tickets');
             if (localStore) {
                 const localTickets = JSON.parse(localStore);
                 const updatedLocal = localTickets.filter((t: any) => t.id !== selectedTicket.id);
                 localStorage.setItem('sentinel_legal_tickets', JSON.stringify(updatedLocal));
             }

             setSelectedTicket(null);
        }, 1000);
        
    } catch (e) {
        alert("Network error. Approval simulated locally.");
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
       <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-header flex items-center gap-2">
             <span className="material-symbols-outlined text-teal-400">gavel</span>
             Legal Approval Queue
          </h2>
          <p className="text-xs text-slate-500">Pending Sign-off Requests</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={loadDemoData}
                className="px-4 py-2 rounded text-xs font-bold bg-slate-800 text-cyan-400 border border-cyan-900/50 hover:bg-slate-700 transition-colors"
            >
                Reset / Load Demo
            </button>
            <button 
                onClick={fetchQueue} 
                className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Refresh Queue"
            >
                <span className="material-symbols-outlined">refresh</span>
            </button>
        </div>
      </div>

      <div className="glass-panel p-0 rounded overflow-hidden bg-slate-900/50 flex-1 relative">
        {loading && (
            <div className="absolute inset-0 bg-slate-900/80 z-10 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-teal-500 text-3xl">sync</span>
            </div>
        )}
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-500 text-xs uppercase border-b border-slate-700">
                <tr>
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Risk</th>
                    <th className="p-4">Citations</th>
                    <th className="p-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {!loading && tickets.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                            No pending items in queue. 
                            <br/>Click "Reset / Load Demo" to verify workflow.
                        </td>
                    </tr>
                )}
                {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4 font-mono text-xs text-teal-500">{t.id}</td>
                        <td className="p-4 font-medium text-white">
                            {t.title} 
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 ml-2 block mt-1 truncate max-w-[200px]">
                                {t.clause_id}
                            </span>
                        </td>
                        <td className="p-4 text-slate-400">{t.author}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.risk === 'CRITICAL' || t.risk === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                {t.risk || 'MEDIUM'}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="flex gap-1 flex-wrap max-w-[150px]">
                                {t.citations && t.citations.length > 0 ? t.citations.map((c: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-slate-800 px-1 rounded border border-slate-700 text-slate-400">
                                        {c}
                                    </span>
                                )) : <span className="text-slate-600 text-xs">-</span>}
                            </div>
                        </td>
                        <td className="p-4 text-right">
                            <button 
                                onClick={() => setSelectedTicket(t)}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg shadow-teal-900/20"
                            >
                                Review
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <LegalGateModal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onApprove={handleApprove} 
      />
    </div>
  );
};

export default LegalQueue;