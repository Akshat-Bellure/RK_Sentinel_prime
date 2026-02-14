import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
            {icon}
          </span>
        )}
        <input 
          className={`w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder:text-gray-400 ${icon ? 'pl-10' : ''} ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{error}</p>}
    </div>
  );
};