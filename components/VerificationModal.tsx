import React from 'react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">gavel</span>
            Double-Blind Verification
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Source 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">SOURCE: GFR_2017_RULE_144.pdf</span>
              <a href="#" className="text-cyan-500 hover:underline text-xs flex items-center">
                <span className="material-symbols-outlined text-[12px] mr-1">link</span>View Official PDF
              </a>
            </div>
            <div className="bg-slate-950 p-4 rounded border border-slate-800 font-serif text-slate-300 text-sm leading-relaxed">
              "...Any bidder from a country which shares a land border with India will be eligible to bid in any procurement whether of goods, services... only if the bidder is registered with the Competent Authority."
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Exact Text Match (Hash Verified)
            </p>
          </div>

          {/* Source 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">SOURCE: DPDP_ACT_2023.pdf</span>
            </div>
            <div className="bg-slate-950 p-4 rounded border border-slate-800 font-serif text-slate-300 text-sm leading-relaxed">
              "The Central Government may, by notification, restrict the transfer of personal data by a Data Fiduciary for processing to such country or territory outside India as may be so notified." (Section 16(1))
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Semantic Match High
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/50">
          <button 
            onClick={onClose} 
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-cyan-900/30"
          >
            Confirm Verification
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
