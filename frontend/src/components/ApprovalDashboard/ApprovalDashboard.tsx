import React, { useState, useEffect } from 'react';
import { ApprovalQueue } from './ApprovalQueue';
import { ApprovalDecisionModal } from './ApprovalDecisionModal';
import { ApprovalStatusCard } from './ApprovalStatusCard';

interface PendingApproval {
  gateId: number;
  pilId: number;
  productName: string;
  gateType: string;
  market: string;
  assignedAt: string;
  priority: 'urgent' | 'normal' | 'low';
}

interface ApprovalDashboardProps {
  userId: number;
}

export const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({ userId }) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    avgResponseTime: '0h',
  });

  useEffect(() => {
    fetchPendingApprovals();
  }, [userId]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      // Mock API call
      const mockApprovals: PendingApproval[] = [
        {
          gateId: 1,
          pilId: 101,
          productName: 'Paracetamol 500mg',
          gateType: 'regulatory',
          market: 'TFDA',
          assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent',
        },
        {
          gateId: 2,
          pilId: 102,
          productName: 'Ibuprofen 400mg',
          gateType: 'translation',
          market: 'FDA_Thailand',
          assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          priority: 'normal',
        },
        {
          gateId: 3,
          pilId: 103,
          productName: 'Amoxicillin 250mg',
          gateType: 'final_submission',
          market: 'DAV',
          assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          priority: 'normal',
        },
      ];

      setPendingApprovals(mockApprovals);
      setStats({
        pending: mockApprovals.length,
        approvedToday: 5,
        avgResponseTime: '2.5h',
      });
    } catch (error) {
      console.error('Failed to fetch pending approvals', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setShowDecisionModal(true);
  };

  const handleDecisionSubmit = async (decision: 'approved' | 'rejected', comments?: string) => {
    try {
      // Mock API call
      console.log('Submitting decision', { decision, comments, gateId: selectedApproval?.gateId });

      // Remove from pending list
      setPendingApprovals((prev) =>
        prev.filter((a) => a.gateId !== selectedApproval?.gateId)
      );

      setShowDecisionModal(false);
      setSelectedApproval(null);

      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approvedToday: decision === 'approved' ? prev.approvedToday + 1 : prev.approvedToday,
      }));
    } catch (error) {
      console.error('Failed to submit decision', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading approvals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ApprovalStatusCard
          title="Pending Approvals"
          value={stats.pending}
          icon="⏳"
          color="amber"
        />
        <ApprovalStatusCard
          title="Approved Today"
          value={stats.approvedToday}
          icon="✅"
          color="emerald"
        />
        <ApprovalStatusCard
          title="Avg Response Time"
          value={stats.avgResponseTime}
          icon="⚡"
          color="violet"
        />
      </div>

      {/* Approval Queue */}
      <ApprovalQueue approvals={pendingApprovals} onApprovalClick={handleApprovalClick} />

      {/* Decision Modal */}
      {showDecisionModal && selectedApproval && (
        <ApprovalDecisionModal
          approval={selectedApproval}
          onClose={() => setShowDecisionModal(false)}
          onSubmit={handleDecisionSubmit}
        />
      )}
    </div>
  );
};