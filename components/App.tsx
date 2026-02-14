import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Analyzer from './Analyzer';
import PreBidStudio from './PreBidStudio';
import Calculator from './Calculator';
import Vault from './Vault';
import Login from './Login';
import Onboarding from './Onboarding';
import VerificationModal from './VerificationModal';

// Extend window interface for map popup navigation
declare global {
  interface Window {
    navigateToView: (viewName: string) => void;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Expose navigation to window for Leaflet popups
  useEffect(() => {
    window.navigateToView = (viewName: string) => {
      if (Object.values(View).includes(viewName as View)) {
        setCurrentView(viewName as View);
      }
    };
  }, []);

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      // Simulate first-time login check
      if (user.name === 'New Vendor') {
          setShowOnboarding(true);
      } else {
          setCurrentView(View.DASHBOARD);
      }
  };

  const handleOnboardingComplete = () => {
      setShowOnboarding(false);
      setCurrentView(View.DASHBOARD);
  };

  // SVG User Profile Base64
  const userProfileSvg = `data:image/svg+xml;base64,IDxzdmcgd2lkdGg9IjEwMjQiIGhlaWdodD0iMTAyNCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+IDxkZWZzPiA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSItMTAwJSIgeTE9IjAiIHgyPSIwIiB5Mj0iMCI+IDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2QwZDRkOCIvPiA8c3RvcCBvZmZzZXQ9Ii41IiBzdG9wLWNvbG9yPSIjZjhmYWZjIi8+IDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2QwZDRkOCIvPiA8YW5pbWF0ZVRyYW5zZm9ybSBpZD0iYSIgYXR0cmlidXRlTmFtZT0iZ3JhZGllbnRUcmFuc2Zvcm0iIHR5cGU9InRyYW5zbGF0ZSIgZnJvbT0iMCIgdG89IjIiIGR1cj0iMXMiIGJlZ2luPSIwcyIvPiA8YW5pbWF0ZVRyYW5zZm9ybSBpZD0iYiIgYXR0cmlidXRlTmFtZT0iZ3JhZGllbnRUcmFuc2Zvcm0iIHR5cGU9InRyYW5zbGF0ZSIgZnJvbT0iMCIgdG89IjIiIGR1cj0iMS41cyIgYmVnaW49ImEuZW5kIi8+IDxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9ImdyYWRpZW50VHJhbnNmb3JtIiB0eXBlPSJ0cmFuc2xhdGUiIGZyb209IjAiIHRvPSIyIiBkdXI9IjJzIiBiZWdpbj0iYi5lbmQiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+IDwvbGluZWFyR3JhZGllbnQ+IDwvZGVmcz4gPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZykiLz4gPC9zdmc+`;

  const renderView = () => {
    if (showOnboarding) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case View.ANALYZER:
        return <Analyzer onViewChange={setCurrentView} />;
      case View.PREBID:
        return <PreBidStudio onViewChange={setCurrentView} onOpenModal={() => setIsModalOpen(true)} />;
      case View.CALCULATOR:
        return <Calculator />;
      case View.VAULT:
        return <Vault />;
      case View.ONBOARDING:
        return <Onboarding onComplete={handleOnboardingComplete} />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden text-sm bg-slate-950 text-slate-200 font-inter">
      {/* Sidebar */}
      {!showOnboarding && <Sidebar currentView={currentView} onViewChange={setCurrentView} />}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-slate-950">
        {/* Header */}
        {!showOnboarding && (
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-gov-warning/10 text-gov-warning text-xs font-mono rounded border border-gov-warning/20 animate-pulse flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-gov-warning"></span>
                LIVE FEED ACTIVE
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">
                Last Sync: <span className="font-mono text-cyan-400">14:02:45 IST</span>
                </span>
                <span className="text-[10px] text-slate-600 font-mono hidden lg:block border border-slate-800 px-2 py-0.5 rounded">
                AI MODEL: SENTINEL-CORE-V2
                </span>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-white relative transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                    <p className="text-white font-medium text-xs">{currentUser.name}</p>
                    <p className="text-[10px] text-cyan-500 font-mono">{currentUser.designation}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 p-0.5 border border-slate-700 overflow-hidden">
                    <img alt="User" className="w-full h-full object-cover rounded-full" src={userProfileSvg} />
                </div>
                </div>
            </div>
            </header>
        )}

        {/* View Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
          {renderView()}
        </div>
      </main>

      {/* Modal */}
      <VerificationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}