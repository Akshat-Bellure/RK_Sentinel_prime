import React, { useState, useEffect } from 'react';
import { View } from '../types';
import VerificationModal from './VerificationModal';

interface PreBidStudioProps {
  onViewChange: (view: View) => void;
  onOpenModal: () => void;
}

const PreBidStudio: React.FC<PreBidStudioProps> = ({ onViewChange, onOpenModal }) => {
  const [tone, setTone] = useState<'neutral' | 'advisory' | 'strict'>('advisory');
  const [isGenerating, setIsGenerating] = useState(false);
  const [queryText, setQueryText] = useState('');
  
  // Templates based on PDF strategies
  const templates = {
    neutral: `Ref Clause 4.2 (Hosting Requirements):

Request for clarification: Does the Department explicitly require hosting outside India? 
We request the authority to allow MeitY Empanelled Cloud Service Providers (CSPs) within India to participate, ensuring broader competition and data sovereignty.`,
    
    advisory: `Ref Clause 4.2 (Hosting Requirements):

The current clause specifies hosting in US/EU/Singapore. We respectfully submit that this appears to be in contradiction with the data localization principles outlined in the Digital Personal Data Protection Act (DPDP) 2023 and MeitY's cloud empanelment guidelines for sensitive government data.

Request: Please amend the clause to mandate "MeitY Empanelled Cloud Service Provider with data centers located within the territorial jurisdiction of India" to ensure sovereignty and compliance with GOI statutory requirements.`,
    
    strict: `Ref Clause 4.2 (Hosting Requirements) - CRITICAL VIOLATION NOTICE:

The requirement for foreign data residency strictly violates Section 17 of the DPDP Act 2023 and CVC Circular No. 03/01/18 regarding restrictive practices. Mandating "US/EU" hosting creates a monopoly for specific foreign vendors, disqualifying competent Indian Class-I suppliers.

Request: The clause MUST be rectified to "India-hosted MeitY empanelled cloud" immediately to avoid vigilance scrutiny and ensure compliance with Make-in-India (Class-I) Order 2017.`
  };

  useEffect(() => {
    // Set initial text
    setQueryText(templates[tone]);
  }, []);

  const handleToneChange = (newTone: 'neutral' | 'advisory' | 'strict') => {
    setTone(newTone);
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
        setQueryText(templates[newTone]);
        setIsGenerating(false);
    }, 600);
  };

  const handleRegenerate = () => {
      setIsGenerating(true);
      setTimeout(() => {
          setIsGenerating(false);
      }, 800);
  }

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
          <h2 className="text-2xl font-bold text-white font-header">Pre-Bid Query Studio</h2>
          <p className="text-xs text-slate-500">Drafting query for <span className="text-teal-400 font-mono font-bold">Clause 4.2 (Hosting)</span></p>
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
                onClick={() => handleToneChange('neutral')}
              >
                Neutral Inquiry
              </button>
              <button 
                className={`p-2 rounded border text-xs text-center font-medium transition-colors ${tone === 'advisory' ? 'border-teal-500 bg-teal-500/10 text-teal-400 font-bold' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                onClick={() => handleToneChange('advisory')}
              >
                Advisory / Compliance
              </button>
              <button 
                className={`p-2 rounded border text-xs text-center transition-colors ${tone === 'strict' ? 'border-red-500 bg-red-500/10 text-red-400 font-bold' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                onClick={() => handleToneChange('strict')}
              >
                Strict / Restrictive
              </button>
            </div>
          </div>

          <div className="glass-panel p-4 rounded border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-yellow-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Legal Substantiation
              </h3>
              <button 
                className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-600 transition-colors text-slate-300 font-medium"
                onClick={onOpenModal}
              >
                Verify Source
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2 font-serif">
              "The Digital Personal Data Protection Act 2023 empowers the Central Government to restrict transfer of personal data to certain countries. Additionally, MeitY guidelines require government data to be hosted within India."
            </p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-500 font-mono">Hash: 8a7f...9e21</span>
              <span className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 flex items-center gap-1 font-bold">
                 <span className="material-symbols-outlined text-[10px]">check</span> Verified in KB
              </span>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded bg-slate-900/50">
             <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Reference Rules (Auto-Attached)</h3>
             <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                <li>GFR 2017 Rule 144(xi) - Land Border</li>
                <li>Public Procurement (Preference to Make in India) Order 2017</li>
                <li>MeitY Guidelines for Cloud Empanelment</li>
             </ul>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="glass-panel p-6 rounded flex flex-col relative bg-slate-900/50 border-slate-700">
          <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block font-bold">Generated Query</label>
          
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
                onClick={handleRegenerate}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-sm border border-slate-600 transition-colors font-medium shadow-sm"
            >
              Regenerate
            </button>
            <button className="flex-[2] bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-sm">send</span>
              Add to Final Pack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreBidStudio;