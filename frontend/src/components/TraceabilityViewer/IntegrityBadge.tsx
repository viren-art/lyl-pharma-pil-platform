import React from 'react';

interface IntegrityBadgeProps {
  isValid: boolean | null;
}

export const IntegrityBadge: React.FC<IntegrityBadgeProps> = ({ isValid }) => {
  if (isValid === null) {
    return (
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-zinc-700 rounded-full">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-zinc-400"></div>
        <span className="text-xs font-medium text-zinc-400">Verifying...</span>
      </div>
    );
  }

  if (isValid) {
    return (
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-medium text-emerald-400">Integrity Verified</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-rose-500/20 rounded-full">
      <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-xs font-medium text-rose-400">Integrity Failed</span>
    </div>
  );
};