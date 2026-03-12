import React, { useState, useEffect } from 'react';
import { TerminologySearch } from './TerminologySearch';
import { TerminologyList } from './TerminologyList';
import { TermSubmissionForm } from './TermSubmissionForm';
import { PendingApprovals } from './PendingApprovals';
import { ConsistencyReport } from './ConsistencyReport';

interface Term {
  id: number;
  sourceTerm: string;
  targetTerm: string;
  sourceLanguage: string;
  targetLanguage: string;
  marketApplicability: string;
  usageCount: number;
  approvedAt: Date | null;
  approvedBy: number | null;
}

interface TerminologyManagerProps {
  userRole: 'Translator' | 'Regulatory_Reviewer' | 'Approver';
  targetLanguage: 'zh-TW' | 'th' | 'vi';
  market: 'TFDA' | 'FDA_Thailand' | 'DAV';
}

export const TerminologyManager: React.FC<TerminologyManagerProps> = ({
  userRole,
  targetLanguage,
  market
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'submit' | 'pending' | 'consistency'>('search');
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canApprove = userRole === 'Regulatory_Reviewer' || userRole === 'Approver';

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearchQuery(query);

    try {
      const response = await fetch(
        `/api/v1/translation-memory/search?query=${encodeURIComponent(query)}&targetLanguage=${targetLanguage}&market=${market}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      setTerms(data.results);
    } catch (error) {
      console.error('Failed to search terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTermSubmit = async (termData: any) => {
    try {
      const response = await fetch('/api/v1/translation-memory/terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(termData)
      });

      if (response.ok) {
        alert('Term submitted for approval');
        setActiveTab('pending');
      }
    } catch (error) {
      console.error('Failed to submit term:', error);
    }
  };

  const handleOverride = async (termId: number, newTargetTerm: string, justification: string) => {
    try {
      const response = await fetch(`/api/v1/translation-memory/terms/${termId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newTargetTerm, justification })
      });

      if (response.ok) {
        alert('Term overridden successfully');
        handleSearch(searchQuery);
      }
    } catch (error) {
      console.error('Failed to override term:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Translation Memory Manager</h1>
          <p className="text-zinc-400">
            Manage pharmaceutical terminology across all PIL projects
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'search'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Search Terms
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'submit'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Submit New Term
          </button>
          {canApprove && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'pending'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pending Approvals
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => setActiveTab('consistency')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'consistency'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Consistency Report
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'search' && (
            <>
              <TerminologySearch onSearch={handleSearch} loading={loading} />
              <TerminologyList
                terms={terms}
                canOverride={canApprove}
                onOverride={handleOverride}
              />
            </>
          )}

          {activeTab === 'submit' && (
            <TermSubmissionForm
              targetLanguage={targetLanguage}
              market={market}
              onSubmit={handleTermSubmit}
            />
          )}

          {activeTab === 'pending' && canApprove && (
            <PendingApprovals targetLanguage={targetLanguage} market={market} />
          )}

          {activeTab === 'consistency' && canApprove && (
            <ConsistencyReport targetLanguage={targetLanguage} market={market} />
          )}
        </div>
      </div>
    </div>
  );
};