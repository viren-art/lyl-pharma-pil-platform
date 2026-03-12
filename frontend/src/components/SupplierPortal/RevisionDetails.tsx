import React, { useState, useEffect } from 'react';
import { ArtworkUpload } from './ArtworkUpload';
import { CommentThread } from './CommentThread';
import { VersionHistory } from './VersionHistory';

interface ArtworkVersion {
  id: number;
  versionNumber: number;
  artworkPath: string;
  visualDiffPath?: string;
  status: string;
  uploadedBy: string;
  createdAt: string;
  notes?: string;
}

interface Comment {
  id: number;
  type: string;
  content: string;
  sectionReference?: string;
  authorName: string;
  createdAt: string;
  isInternal: boolean;
  replies?: Comment[];
}

interface RevisionDetailsProps {
  revisionRoundId: number;
  productName: string;
  onBack: () => void;
  onUploadComplete: () => void;
}

export const RevisionDetails: React.FC<RevisionDetailsProps> = ({
  revisionRoundId,
  productName,
  onBack,
  onUploadComplete,
}) => {
  const [versions, setVersions] = useState<ArtworkVersion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'versions' | 'comments'>('upload');
  const [canUpload, setCanUpload] = useState(true);

  useEffect(() => {
    fetchRevisionDetails();
  }, [revisionRoundId]);

  const fetchRevisionDetails = async () => {
    try {
      setLoading(true);
      // Mock API call
      const mockVersions: ArtworkVersion[] = [
        {
          id: 1,
          versionNumber: 1,
          artworkPath: 's3://bucket/artwork-v1.pdf',
          status: 'rejected',
          uploadedBy: 'John Supplier',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Initial submission',
        },
      ];

      const mockComments: Comment[] = [
        {
          id: 1,
          type: 'change_request',
          content: 'Please update the dosage section to match the latest TFDA guidelines.',
          sectionReference: 'Page 2, Dosage',
          authorName: 'Sarah Reviewer',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isInternal: false,
        },
        {
          id: 2,
          type: 'question',
          content: 'Can you clarify the contraindications formatting?',
          sectionReference: 'Page 3',
          authorName: 'Mike Approver',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isInternal: false,
        },
      ];

      setVersions(mockVersions);
      setComments(mockComments);
    } catch (error) {
      console.error('Failed to fetch revision details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newVersion: ArtworkVersion) => {
    setVersions([newVersion, ...versions]);
    setActiveTab('versions');
    onUploadComplete();
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments([...comments, newComment]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{productName}</h1>
              <p className="text-sm text-zinc-400 mt-1">Revision Round Details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'upload' ? 'text-violet-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Upload Artwork
            {activeTab === 'upload' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'versions' ? 'text-violet-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Version History ({versions.length})
            {activeTab === 'versions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-3 font-semibold transition-colors relative ${
              activeTab === 'comments' ? 'text-violet-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Comments ({comments.length})
            {activeTab === 'comments' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading...</div>
        ) : (
          <>
            {activeTab === 'upload' && (
              <ArtworkUpload
                revisionRoundId={revisionRoundId}
                canUpload={canUpload}
                onUploadSuccess={handleUploadSuccess}
              />
            )}
            {activeTab === 'versions' && <VersionHistory versions={versions} />}
            {activeTab === 'comments' && (
              <CommentThread
                revisionRoundId={revisionRoundId}
                comments={comments}
                onCommentAdded={handleCommentAdded}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};