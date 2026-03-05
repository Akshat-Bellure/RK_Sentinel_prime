import React, { useState } from 'react';
import { View } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    shortcode: '',
    pan: '',
    gst: '',
    authName: '',
    authEmail: '',
    authMobile: '',
    categories: [] as string[],
    dataLoc: 'india',
    certs: [] as string[],
    hostingProof: null as File | null,
    bomFile: null as File | null,
    preferredStates: [] as string[],
    consent: false
  });

  const categories = ['IT Hardware', 'Software Services', 'Surveillance', 'Civil Works', 'Medical Equip'];
  const certsList = ['STQC', 'ISO-27001', 'CMMI-5', 'BIS', 'MeitY Empanelment'];
  const statesList = ['All India', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh'];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete();
  };

  // Simulation of Backend ID Generation: SB-{3consonants}-{4digits}
  const generateVendorId = () => {
      const name = formData.companyName || "UNKNOWN";
      const consonants = name.replace(/[aeiouAEIOU\s\W0-9]/g, '').toUpperCase();
      const prefix = (consonants.length >= 3 ? consonants.slice(0, 3) : (consonants + "XXX").slice(0, 3));
      const digits = Math.floor(1000 + Math.random() * 9000);
      return `SB-${prefix}-${digits}`;
  };

  // Simulation of Backend Password: [Adj][2digits][Syl][Sym]
  const generatePass = () => {
      const adj = ["Solar", "Lunar", "Cyber", "Rapid", "Secure"][Math.floor(Math.random()*5)];
      const num = Math.floor(Math.random() * 90) + 10;
      const syl = ["Xen", "Tek", "Nov", "Sys", "Net"][Math.floor(Math.random()*5)];
      const sym = ["#", "@", "$", "!", "%"][Math.floor(Math.random()*5)];
      return `${adj}${num}${syl}${sym}`;
  };

  const [generatedId, setGeneratedId] = useState('');
  const [generatedPass, setGeneratedPass] = useState('');

  React.useEffect(() => {
      if (step === 3 && !generatedId) {
          setGeneratedId(generateVendorId());
          setGeneratedPass(generatePass());
      }
  }, [step]);

  return (
    <div className="h-full flex items-center justify-center p-6 bg-slate-900/50">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white font-header">Vendor Onboarding</h2>
            <p className="text-xs text-slate-400 mt-1">RK Sentinel Prime // REGISTRATION WIZARD</p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-1 rounded-full ${step >= i ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Organization Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Company Name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">GSTIN <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none uppercase"
                    value={formData.gst}
                    onChange={e => setFormData({...formData, gst: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">PAN <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none uppercase"
                    value={formData.pan}
                    onChange={e => setFormData({...formData, pan: e.target.value})}
                  />
                </div>
                 <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Preferred States</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                    onChange={e => {
                        if (e.target.value && !formData.preferredStates.includes(e.target.value)) {
                            setFormData({...formData, preferredStates: [...formData.preferredStates, e.target.value]});
                        }
                    }}
                  >
                     <option value="">Select State</option>
                     {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-1 mt-2">
                     {formData.preferredStates.map(s => (
                         <span key={s} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-600 flex items-center gap-1">
                             {s} <button onClick={() => setFormData({...formData, preferredStates: formData.preferredStates.filter(st => st !== s)})} className="hover:text-red-400">×</button>
                         </span>
                     ))}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-4 border-b border-slate-800 pb-2">Authorized Representative</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                    value={formData.authName}
                    onChange={e => setFormData({...formData, authName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Official Email (Corporate Domain)</label>
                  <input 
                    type="email" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                    value={formData.authEmail}
                    onChange={e => setFormData({...formData, authEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Mobile (+91)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                    value={formData.authMobile}
                    onChange={e => setFormData({...formData, authMobile: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 fade-in">
              <h3 className="text-lg font-semibold text-white">Compliance & Uploads</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">GeM Categories</label>
                    <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button 
                        key={cat}
                        onClick={() => {
                            const newCats = formData.categories.includes(cat) 
                            ? formData.categories.filter(c => c !== cat)
                            : [...formData.categories, cat];
                            setFormData({...formData, categories: newCats});
                        }}
                        className={`px-3 py-1 rounded-full text-xs border ${
                            formData.categories.includes(cat) 
                            ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                        >
                        {cat}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">Certifications (Select Multiple)</label>
                    <div className="flex flex-wrap gap-2">
                    {certsList.map(cert => (
                        <button 
                        key={cert}
                        onClick={() => {
                            const newCerts = formData.certs.includes(cert) 
                            ? formData.certs.filter(c => c !== cert)
                            : [...formData.certs, cert];
                            setFormData({...formData, certs: newCerts});
                        }}
                        className={`px-3 py-1 rounded-full text-xs border ${
                            formData.certs.includes(cert) 
                            ? 'bg-green-900/30 border-green-500 text-green-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                        >
                        {cert}
                        </button>
                    ))}
                    </div>
                    <label className="block mt-2 cursor-pointer bg-slate-900 border border-dashed border-slate-600 p-2 text-center rounded text-xs text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
                        Upload Certificate Files (PDF)
                        <input type="file" multiple className="hidden" />
                    </label>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded border border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.dataLoc === 'india' ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                      {formData.dataLoc === 'india' && <span className="material-symbols-outlined text-white text-xs">check</span>}
                   </div>
                   <div>
                      <p className="text-sm text-white font-medium">Data Hosting in India (ap-south-1)</p>
                      <p className="text-xs text-slate-400">I certify that all critical data will be stored within Indian territorial jurisdiction.</p>
                   </div>
                </label>
                
                {formData.dataLoc === 'india' && (
                    <div className="ml-8">
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Upload Hosting Proof (Cloud Agreement/Invoice)</label>
                        <input 
                            type="file" 
                            className="text-xs text-slate-400 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                            onChange={e => setFormData({...formData, hostingProof: e.target.files ? e.target.files[0] : null})}
                        />
                    </div>
                )}
              </div>

              <div className="p-4 bg-slate-800 rounded border border-slate-700">
                 <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 uppercase font-bold">BOM Template (Class-I Check)</label>
                    <a href="/sample_data/bom_template.csv" download className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">download</span> Download CSV Template
                    </a>
                 </div>
                 <div className="mt-2 h-24 border-2 border-dashed border-slate-600 rounded flex flex-col items-center justify-center text-slate-500 text-xs hover:border-slate-500 cursor-pointer transition-colors relative">
                     <span className="material-symbols-outlined text-2xl mb-1">upload_file</span>
                     {formData.bomFile ? formData.bomFile.name : "Drag & Drop BOM CSV or Click to Upload"}
                     <input 
                        type="file" 
                        accept=".csv"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => setFormData({...formData, bomFile: e.target.files ? e.target.files[0] : null})}
                     />
                 </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-4 border-t border-slate-800">
                <input 
                  type="checkbox" 
                  checked={formData.consent}
                  onChange={e => setFormData({...formData, consent: e.target.checked})}
                  className="accent-cyan-500 w-4 h-4"
                />
                <span className="text-xs text-slate-400">
                    I agree to the <span className="text-cyan-500">DPDP Act 2023 Compliance</span> terms and Sentinel Bharat Anti-Collusion Policy. I understand that false declarations will lead to blacklisting.
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 fade-in py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <span className="material-symbols-outlined text-green-500 text-4xl">lock_reset</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Credentials Generated</h3>
              
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded max-w-sm mx-auto flex items-start gap-2 text-left">
                 <span className="material-symbols-outlined text-red-500 text-xl shrink-0">visibility_off</span>
                 <p className="text-xs text-red-300"><strong>SECURITY WARNING:</strong> These credentials will be shown <u>EXACTLY ONCE</u>. They will not be emailed. Copy them now.</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 max-w-sm mx-auto space-y-5 relative group">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vendor ID</label>
                  <p className="text-2xl font-mono text-cyan-400 font-bold tracking-wide">{generatedId}</p>
                </div>
                <div className="border-t border-slate-800 pt-4">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Initial Password</label>
                  <p className="text-2xl font-mono text-white font-bold tracking-wider">{generatedPass}</p>
                  <div className="text-[10px] text-slate-500 mt-1">Entropy: ~60 bits</div>
                </div>
                
                <button 
                  onClick={() => navigator.clipboard.writeText(`ID: ${generatedId}\nPass: ${generatedPass}`)}
                  className="absolute top-2 right-2 p-2 text-slate-500 hover:text-white bg-slate-900 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy to Clipboard"
                >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
              
              <div className="text-xs text-slate-500 max-w-xs mx-auto space-y-2">
                <p>A verification link has been sent to <span className="text-slate-300">{formData.authEmail}</span>.</p>
                {formData.authMobile && (
                    <p className="text-cyan-500 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">sms</span> OTP sent to {formData.authMobile}
                    </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-900/50 shrink-0">
           {step > 1 && step < 3 && (
             <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 transition-colors">
               Back
             </button>
           )}
           <div className="flex-1"></div>
           <button 
             onClick={handleNext}
             disabled={step === 2 && !formData.consent}
             className={`bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-2.5 rounded font-bold text-sm transition-all shadow-lg shadow-cyan-900/20 ${step === 2 && !formData.consent ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {step === 3 ? 'Acknowledge & Login' : 'Next Step'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
