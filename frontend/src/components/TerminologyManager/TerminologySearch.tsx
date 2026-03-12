import React, { useState } from 'react';

interface TerminologySearchProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export const TerminologySearch: React.FC<TerminologySearchProps> = ({
  onSearch,
  loading
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pharmaceutical terms..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
};