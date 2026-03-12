import React, { useState } from 'react';

interface TermSubmissionFormProps {
  targetLanguage: 'zh-TW' | 'th' | 'vi';
  market: 'TFDA' | 'FDA_Thailand' | 'DAV';
  onSubmit: (termData: any) => void;
}

export const TermSubmissionForm: React.FC<TermSubmissionFormProps> = ({
  targetLanguage,
  market,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    sourceTerm: '',
    targetTerm: '',
    sourceLanguage: 'en',
    targetLanguage,
    marketApplicability: market,
    justification: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      sourceTerm: '',
      targetTerm: '',
      sourceLanguage: 'en',
      targetLanguage,
      marketApplicability: market,
      justification: ''
    });
  };

  return (
    <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
      <h2 className="text-xl font-bold mb-6">Submit New Pharmaceutical Term</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            English Source Term
          </label>
          <input
            type="text"
            value={formData.sourceTerm}
            onChange={(e) => setFormData({ ...formData, sourceTerm: e.target.value })}
            placeholder="e.g., contraindications"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Target Language Translation
          </label>
          <input
            type="text"
            value={formData.targetTerm}
            onChange={(e) => setFormData({ ...formData, targetTerm: e.target.value })}
            placeholder={
              targetLanguage === 'zh-TW'
                ? 'e.g., 禁忌症'
                : targetLanguage === 'th'
                ? 'e.g., ข้อห้ามใช้'
                : 'e.g., chống chỉ định'
            }
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Market Applicability
          </label>
          <select
            value={formData.marketApplicability}
            onChange={(e) => setFormData({ ...formData, marketApplicability: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="TFDA">TFDA (Taiwan)</option>
            <option value="FDA_Thailand">FDA Thailand</option>
            <option value="DAV">DAV (Vietnam)</option>
            <option value="all">All Markets</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">
            Justification (Optional)
          </label>
          <textarea
            value={formData.justification}
            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
            placeholder="Explain why this term should be added to the approved glossary..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Submit for Approval
        </button>
      </form>
    </div>
  );
};