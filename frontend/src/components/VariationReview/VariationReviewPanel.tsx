import React, { useState, useEffect } from 'react';
import { VariationDiffViewer } from './VariationDiffViewer';
import { VariationApprovalForm } from './VariationApprovalForm';

interface Variation {
  id: number;
  announcementId: number;
  pilId: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'draft_generated';
  affectedSections: SectionDiff[];
  overallConfidence: number;
  draftPILPath?: string;
  diffReportPath?: string;
  createdAt: string;
}

interface SectionDiff {
  sectionType: string;
  sectionName: string;
  currentText: string;
  requiredText: string;
  diffHighlights: DiffHighlight[];
  confidence: number;
  requiresUpdate: boolean;
}

interface DiffHighlight {
  type: 'addition' | 'deletion' | 'modification';
  startIndex: number;
  endIndex: number;
  originalText?: string;
  newText?: string;
}

interface VariationReviewPanelProps {
  variationId: number;
  onApprove?: (variationId: number) => void;
  onReject?: (variationId: number) => void;
}

export const VariationReviewPanel: React.FC<VariationReviewPanelProps> = ({
  variationId,
  onApprove,
  onReject,
}) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  useEffect(() => {
    fetchVariation();
  }, [variationId]);

  const fetchVariation = async () => {
    try {
      const response = await fetch(`/api/v1/variations/${variationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch variation');
      }

      const data = await response.json();
      setVariation(data);
    } catch (error) {
      console.error('Error fetching variation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    try {
      const response = await fetch(`/api/v1/variations/${variationId}/generate-draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft');
      }

      await fetchVariation();
    } catch (error) {
      console.error('Error generating draft:', error);
    }
  };

  const handleApprove = async (comments?: string) => {
    try {
      const response = await fetch(`/api/v1/variations/${variationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ comments }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve variation');
      }

      if (onApprove) {
        onApprove(variationId);
      }
    } catch (error) {
      console.error('Error approving variation:', error);
    }
  };

  const handleReject = async (comments: string) => {
    try {
      const response = await fetch(`/api/v1/variations/${variationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ comments }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject variation');
      }

      if (onReject) {
        onReject(variationId);
      }
    } catch (error) {
      console.error('Error rejecting variation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading variation...</div>
      </div>
    );
  }

  if (!variation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Variation not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Variation Review</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Variation ID: {variation.id} • Overall Confidence: {variation.overallConfidence}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            {variation.status === 'pending_review' && (
              <>
                <button
                  onClick={handleGenerateDraft}
                  className="px-4 py-2 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition-colors"
                >
                  Generate Draft PIL
                </button>
                <button
                  onClick={() => setShowApprovalForm(true)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Review & Approve
                </button>
              </>
            )}
            {variation.draftPILPath && (
              <a
                href={`/api/v1/files/${variation.draftPILPath}`}
                className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-colors"
                download
              >
                Download Draft
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-zinc-800/50 rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          {variation.affectedSections.map((section, index) => (
            <button
              key={index}
              onClick={() => setSelectedSection(index)}
              className={`px-6 py-4 font-semibold transition-colors ${
                selectedSection === index
                  ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {section.sectionName}
              <span className="ml-2 text-xs">({section.confidence}%)</span>
            </button>
          ))}
        </div>

        {/* Diff Viewer */}
        <div className="p-6">
          <VariationDiffViewer
            section={variation.affectedSections[selectedSection]}
          />
        </div>
      </div>

      {/* Approval Form Modal */}
      {showApprovalForm && (
        <VariationApprovalForm
          variationId={variation.id}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setShowApprovalForm(false)}
        />
      )}
    </div>
  );
};