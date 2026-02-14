import React, { useState } from 'react';

interface LegalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (signature: string) => void;
}

const LegalGateModal: React.FC<LegalGateModalProps> = ({ isOpen, onClose, onApprove }) => {
  const [step, setStep] = useState(1);
  const [signature, setSignature] = useState('');
  const [totp, setTotp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSign = () => {
    if (signature.length < 5) return;
    setStep(2);
  };

  const handleFinalApprove = () => {
    if (totp.length !== 6) return;
    setIsProcessing(true);
    setTimeout(() => {
        setIsProcessing(false);
        onApprove(signature);
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 fade-in">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-4 border-b border-primary-dark flex justify-between items-center text-white">
          <h3 className="text-lg font-bold font-header flex items-center gap-2">
            <span className="material-symbols-outlined text-accent">gavel</span>
            Legal Gate Approval
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-surface p-3 rounded border border-gray-200 text-sm text-gray-700">
                <p className="font-semibold mb-1">Declaration:</p>
                <p className="text-xs">I hereby certify that the generated pre-bid queries/documents have been reviewed against GFR 2017 and are legally compliant. I authorize this export.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Auditor Signature (Full Name)</label>
                <input 
                  type="text" 
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:border-primary focus:outline-none font-serif italic text-lg"
                  placeholder="e.g. Dr. A. K. Sharma"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSign}
                  disabled={signature.length < 3}
                  className="bg-primary hover:bg-navy-800 text-white px-4 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Proceed to 2FA
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mx-auto">
                 <span className="material-symbols-outlined text-primary text-3xl">lock</span>
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-gray-900">2FA Verification</h4>
                <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
              </div>

              <div>
                 <input 
                    type="text" 
                    maxLength={6}
                    className="w-40 text-center text-2xl tracking-widest border border-gray-300 rounded p-2 focus:border-accent focus:outline-none font-mono"
                    placeholder="000000"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g,''))}
                 />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-gray-900">Back</button>
                <button 
                  onClick={handleFinalApprove}
                  disabled={totp.length !== 6 || isProcessing}
                  className="bg-accent hover:bg-teal-600 text-white px-6 py-2 rounded text-sm font-bold transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? 'Verifying...' : 'Sign & Approve'}
                  <span className="material-symbols-outlined text-sm">verified</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-3 border-t border-gray-200 text-[10px] text-gray-400 text-center font-mono">
           TIMESTAMP: {new Date().toISOString()} | IP: 10.20.1.45
        </div>
      </div>
    </div>
  );
};

export default LegalGateModal;