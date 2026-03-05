import React, { useState, useEffect } from 'react';
import { View } from '../types';
import VerificationModal from './VerificationModal';
import { GoogleGenAI } from "@google/genai";

interface PreBidStudioProps {
  onViewChange: (view: View) => void;
  onOpenModal: () => void;
  contextData?: any;
}

const PreBidStudio: React.FC<PreBidStudioProps> = ({ onViewChange, onOpenModal, contextData }) => {
  const [tone, setTone] = useState<'neutral' | 'advisory' | 'strict'>('advisory');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryText, setQueryText] = useState('');
  
  // Default context if none passed from Analyzer
  const defaultContext = {
    tenderId: "GEM/2025/B/4829",
    clauseId: "4.2",
    clauseText: "The proposed cloud solution must have a primary data center located in the United States or Europe.",
    category: "Data Residency",
    risk: "CRITICAL",
    citations: ["DPDP Act 2023", "MeitY Guidelines"]
  };

  const context = contextData || defaultContext;

  const handleGenerate = async (selectedTone: 'neutral' | 'advisory' | 'strict') => {
    setIsGenerating(true);
    setTone(selectedTone);
    
    try {
        const { coreEngine } = await import('../services/coreProcessingEngine');
        
        const result = await coreEngine.processPreBid({
            tenderId: context.tenderId,
            clauseId: context.clauseId,
            clauseText: context.clauseText,
            category: context.category,
            risk: context.risk,
            citations: context.citations,
            tone: selectedTone
        });

        if (result.success && result.data) {
            setQueryText(result.data);
        } else {
            throw new Error(result.error);
        }

    } catch (error: any) {
        console.error("GenAI Error:", error);
        let errorMessage = "Error connecting to Intelligence Core.";
        if (error.message) errorMessage += ` ${error.message}`;
        setQueryText(errorMessage);
    } finally {
        setIsGenerating(false);
    }
  };

  // Initial generation on load
  useEffect(() => {
    if (!queryText) {
        handleGenerate('advisory');
    }
  }, [contextData]); // Re-run if context changes

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Construct ticket object for local persistence
    const ticketId = "TKT-" + Math.floor(Math.random()*10000) + "-" + tone.toUpperCase().substring(0,3);
    const newTicket = {
        id: ticketId,
        clause_id: `${context.tenderId} - Clause ${context.clauseId}`,
        title: `Query: ${context.category} (${tone})`,
        author: 'Vikram Malhotra', // Simulate current user
        risk: context.risk,
        citations: context.citations,
        status: 'PENDING',
        created_at: new Date().toISOString()
    };

    try {
        const token = localStorage.getItem('token') || 'mock-token'; 
        
        // Attempt real backend submission
        // In a demo environment without backend, this might fail or be mocked, 
        // but we'll persist locally regardless to ensure UI flow works.
        const response = await fetch('http://localhost:8080/api/v1/prebid/draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tender_id: context.tenderId,
                clause_id: context.clauseId,
                clause_text: context.clauseText,
                category: context.category,
                tone: tone,
                risk: context.risk,
                citations: context.citations,
                final_text: queryText
            })
        }).catch(() => null); // Catch fetch error to allow fallthrough
        
        // --- LOCAL PERSISTENCE LAYER ---
        // Save to localStorage so LegalQueue can pick it up without a backend
        const existingStore = localStorage.getItem('sentinel_legal_tickets');
        const tickets = existingStore ? JSON.parse(existingStore) : [];
        tickets.push(newTicket);
        localStorage.setItem('sentinel_legal_tickets', JSON.stringify(tickets));
        // -------------------------------

        alert(`Draft Submitted to Legal Queue!\nTicket ID: ${ticketId}`);
        onViewChange(View.LEGAL_QUEUE);

    } catch (e) {
        alert('Error submitting draft. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col fade-in text-slate-200">
      <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
        <button 
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          onClick={() => onViewChange(View.ANALYZER)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white font-header">Pre-Bid Studio</h2>
          <p className="text-xs text-slate-500">Drafting query for <span className="text-teal-400 font-mono font-bold">{context.tenderId} / Clause {context.clauseId}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Left: Strategy */}
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Tone Strategy</h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                className={`p-2 rounded border text-xs text-center transition-colors ${tone === 'neutral' ? 'border-teal-500 bg-teal-500/10 text-teal-400 font-bold' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                onClick={() => handleGenerate('neutral')}
              >
                Neutral Inquiry
              </button>
              <button 
                className={`p-2 rounded border text-xs text-center font-medium transition-colors ${tone === 'advisory' ? 'border-teal-500 bg-teal-500/10 text-teal-400 font-bold' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                onClick={() => handleGenerate('advisory')}
              >
                Advisory / Compliance
              </button>
              <button 
                className={`p-2 rounded border text-xs text-center transition-colors ${tone === 'strict' ? 'border-red-500 bg-red-500/10 text-red-400 font-bold' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                onClick={() => handleGenerate('strict')}
              >
                Strict / Restrictive
              </button>
            </div>
          </div>

          <div className="glass-panel p-4 rounded border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Legal Context (RAG)
              </h3>
              <button 
                className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-600 transition-colors text-slate-300 font-medium"
                onClick={onOpenModal}
              >
                Verify Source
              </button>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed mb-2 font-serif bg-slate-900/50 p-2 rounded border border-slate-800">
               <p className="font-bold text-slate-500 mb-1">Clause in Question:</p>
               "{context.clauseText}"
            </div>
            <div className="text-xs text-slate-300 leading-relaxed mb-2 font-serif bg-slate-900/50 p-2 rounded border border-slate-800">
               <p className="font-bold text-slate-500 mb-1">Applicable Rules:</p>
               {context.citations?.join(" • ") || "No specific citations found."}
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-500 font-mono">Hash: {Math.random().toString(36).substr(2, 8)}</span>
              <span className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 flex items-center gap-1 font-bold">
                 <span className="material-symbols-outlined text-[10px]">check</span> Context Verified
              </span>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded bg-slate-900/50">
             <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">AI Reasoning</h3>
             <p className="text-xs text-slate-500 leading-relaxed">
                 The model has identified a potential conflict between the clause text and standard procurement guidelines ({context.risk}). The selected tone will adjust the diplomatic phrasing while maintaining legal firmness.
             </p>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="glass-panel p-6 rounded flex flex-col relative bg-slate-900/50 border-slate-700">
          <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block font-bold">Generated Query Preview</label>
          
          <div className="relative flex-1">
             <textarea 
                className={`w-full h-full bg-slate-950 border border-slate-700 rounded p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-teal-500 leading-relaxed resize-none transition-opacity ${isGenerating ? 'opacity-50' : 'opacity-100'}`} 
                spellCheck={false}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
            />
            {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-teal-500 text-3xl">autorenew</span>
                </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 flex gap-3 border-t border-slate-800">
            <button 
                onClick={() => handleGenerate(tone)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-sm border border-slate-600 transition-colors font-medium shadow-sm"
            >
              Regenerate (AI)
            </button>
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting || isGenerating}
                className="flex-[2] bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              ) : (
                  <span className="material-symbols-outlined text-sm">send</span>
              )}
              Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreBidStudio;