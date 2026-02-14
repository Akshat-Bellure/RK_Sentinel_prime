import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate Network Auth Delay
    setTimeout(() => {
      if (email && password) {
        onLogin({
          name: 'Vikram Malhotra',
          designation: 'Senior Procurement Officer',
          clearanceLevel: 'LEVEL-4 (SECRET)',
          organization: 'Defense Electronics Ltd'
        });
      } else {
        setError('Invalid Credentials. Access Denied.');
        setIsLoading(false);
      }
    }, 1500);
  };

  const triggerOnboardingDemo = () => {
      setIsLoading(true);
      setTimeout(() => {
        onLogin({
            name: 'New Vendor',
            designation: 'Applicant',
            clearanceLevel: 'LEVEL-1',
            organization: 'Unregistered'
          });
      }, 1000);
  }

  return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center relative overflow-hidden font-inter">
      {/* Background - Subtle Grid */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Top Brand Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>
      
      <div className="z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-sm shadow-2xl relative overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
           <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-600 mx-auto mb-4 shadow-inner">
            <span className="material-symbols-outlined text-blue-500 text-3xl">verified_user</span>
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl text-white" style={{ fontFamily: '"Times New Roman", serif', fontWeight: 'bold' }}>RK</span>
            <span className="text-2xl font-semibold text-white tracking-wide font-header uppercase">Sentinel</span>
            <span className="text-xl text-teal-400 font-light italic">Prime</span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">Secure Acquisition Gateway</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Officer ID</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">badge</span>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-600 rounded-sm py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 font-mono"
                  placeholder="ENTER ID"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Secure Passkey</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">key</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-600 rounded-sm py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs flex items-center gap-2 bg-red-900/10 p-3 rounded-sm border border-red-900/30">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3 rounded-sm font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isLoading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Authenticate Access
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center space-y-3">
             <button onClick={triggerOnboardingDemo} className="text-xs text-cyan-500 hover:text-cyan-400 font-medium">
                 New Vendor Registration (Demo)
             </button>
            <p className="text-[10px] text-slate-500">
               Authorized Personnel Only. All activities are logged and audited.<br/>
               IP: 203.0.113.45 | Session ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}
            </p>
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <div className="bg-slate-950 px-4 py-2 flex justify-between items-center border-t border-slate-800">
             <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 <span className="text-[10px] text-slate-400 font-mono">SERVER: AP-SOUTH-1</span>
             </div>
             <div className="text-[10px] text-slate-500 font-mono">v2.4.0-STABLE</div>
        </div>
      </div>
    </div>
  );
};

export default Login;