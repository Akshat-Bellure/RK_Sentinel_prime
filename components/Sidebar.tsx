import React, { useState } from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: View.DASHBOARD, label: 'Mission Control', icon: 'dashboard' },
    { id: View.INGEST, label: 'Ingest Station', icon: 'input' }, // Added
    { id: View.ANALYZER, label: 'RFP Analyzer', icon: 'analytics' },
    { id: View.PREBID, label: 'Pre-Bid Studio', icon: 'gavel' },
    { id: View.CALCULATOR, label: 'L1 Calculator', icon: 'calculate' },
    { id: View.VAULT, label: 'Evidence Vault', icon: 'folder_managed' },
    { id: View.LEGAL_QUEUE, label: 'Legal Queue', icon: 'policy', highlight: true },
  ];

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-navy-900 border-r border-slate-700 flex flex-col z-20 shrink-0 transition-all duration-300 ease-in-out relative shadow-lg`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-slate-700 border border-slate-600 text-slate-300 rounded-full p-1 hover:text-white hover:bg-teal-500 transition-colors z-30 shadow-md"
      >
        <span className="material-symbols-outlined text-sm">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Header */}
      <div className={`p-4 flex items-center gap-3 border-b border-slate-800 h-16 ${isCollapsed ? 'justify-center' : ''} bg-navy-900`}>
        <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center shadow-md shrink-0">
          <span className="material-symbols-outlined text-navy-900 text-lg">shield_lock</span>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap flex items-baseline gap-1.5">
            <span className="text-xl text-white leading-none" style={{ fontFamily: '"Times New Roman", serif', fontWeight: 'bold' }}>RK</span>
            <span className="font-semibold text-lg tracking-wide text-white font-header uppercase leading-none">Sentinel</span>
            <span className="text-sm text-teal-400 font-light italic tracking-wider leading-none">Prime</span>
          </div>
        )}
      </div>
      
      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-all ${
                isActive
                  ? 'bg-slate-800 text-teal-400 border-l-4 border-teal-500'
                  : item.highlight 
                    ? 'text-yellow-500 hover:text-yellow-300 hover:bg-slate-800 border-l-4 border-transparent' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-l-4 border-transparent'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'text-teal-400' : item.highlight ? 'text-yellow-500' : 'text-slate-500'}`}>{item.icon}</span>
              {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-slate-800 ${isCollapsed ? 'flex justify-center' : ''} bg-navy-900`}>
        {!isCollapsed ? (
          <div className="bg-slate-800 rounded p-3 text-xs border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-green-400">
              <span className="material-symbols-outlined text-sm">cloud_done</span>
              <span className="font-bold">ap-south-1</span>
            </div>
            <p className="text-slate-400 font-mono">ENCRYPTION: AES-256</p>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center" title="System Secure">
             <span className="material-symbols-outlined text-green-500 text-sm">cloud_done</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
