import React, { useState, useEffect } from 'react';
import { RevisionList } from './RevisionList';
import { RevisionDetails } from './RevisionDetails';
import { PerformanceCard } from './PerformanceCard';

interface Revision {
  id: number;
  pilId: number;
  productName: string;
  roundNumber: number;
  status: string;
  startedAt: string;
  dueDate: string;
  latestVersion?: number;
}

interface PerformanceMetrics {
  qualityScore: number;
  avgTurnaroundHours: number;
  avgRevisionRounds: number;
  onTimeDeliveryRate: number;
}

interface SupplierDashboardProps {
  supplierId: number;
  supplierName: string;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ supplierId, supplierName }) => {
  const [activeRevisions, setActiveRevisions] = useState<Revision[]>([]);
  const [completedRevisions, setCompletedRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    fetchRevisions();
    fetchPerformance();
  }, [supplierId]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      // Mock API call
      const mockActive: Revision[] = [
        {
          id: 1,
          pilId: 101,
          productName: 'Paracetamol 500mg',
          roundNumber: 2,
          status: 'pending_supplier',
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          latestVersion: 1,
        },
        {
          id: 2,
          pilId: 102,
          productName: 'Ibuprofen 400mg',
          roundNumber: 1,
          status: 'pending_supplier',
          startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const mockCompleted: Revision[] = [
        {
          id: 3,
          pilId: 103,
          productName: 'Amoxicillin 250mg',
          roundNumber: 3,
          status: 'approved',
          startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          latestVersion: 3,
        },
      ];

      setActiveRevisions(mockActive);
      setCompletedRevisions(mockCompleted);
    } catch (error) {
      console.error('Failed to fetch revisions', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      // Mock API call
      const mockPerformance: PerformanceMetrics = {
        qualityScore: 87.5,
        avgTurnaroundHours: 36.2,
        avgRevision
Rounds: 2.8,
        onTimeDeliveryRate: 92.3,
      };

      setPerformance(mockPerformance);
    } catch (error) {
      console.error('Failed to fetch performance', error);
    }
  };

  const handleRevisionClick = (revision: Revision) => {
    setSelectedRevision(revision);
  };

  const handleBackToList = () => {
    setSelectedRevision(null);
  };

  if (selectedRevision) {
    return (
      <RevisionDetails
        revisionRoundId={selectedRevision.id}
        productName={selectedRevision.productName}
        onBack={handleBackToList}
        onUploadComplete={fetchRevisions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{supplierName}</h1>
              <p className="text-sm text-zinc-400 mt-1">Supplier Portal</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-zinc-500">Quality Score</div>
                <div className="text-lg font-bold text-emerald-400">
                  {performance?.qualityScore.toFixed(1) || '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Performance Overview */}
        {performance && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Performance Overview</h2>
            <PerformanceCard metrics={performance} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'active'
                ? 'text-violet-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Active Revisions
            {activeTab === 'active' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'completed'
                ? 'text-violet-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Completed
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
        </div>

        {/* Revision List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading revisions...</div>
        ) : (
          <RevisionList
            revisions={activeTab === 'active' ? activeRevisions : completedRevisions}
            onRevisionClick={handleRevisionClick}
          />
        )}
      </div>
    </div>
  );
};