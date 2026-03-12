import React, { useState } from 'react';

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

interface CommentThreadProps {
  revisionRoundId: number;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  revisionRoundId,
  comments,
  onCommentAdded,
}) => {
  const [newComment, setNewComment] = useState('');
  const [sectionRef, setSectionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockComment: Comment = {
        id: Date.now(),
        type: 'general',
        content: newComment,
        sectionReference: sectionRef || undefined,
        authorName: 'Current User',
        createdAt: new Date().toISOString(),
        isInternal: false,
      };

      onCommentAdded(mockComment);
      setNewComment('');
      setSectionRef('');
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      general: '💬',
      change_request: '✏️',
      approval: '✅',
      rejection: '❌',
      question: '❓',
    };
    return icons[type] || '💬';
  };

  return (
    <div className="space-y-6">
      {/* Add Comment */}
      <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
        <h3 className="text-lg font-bold text-white mb-4">Add Comment</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={sectionRef}
            onChange={(e) => setSectionRef(e.target.value)}
            placeholder="Section reference (e.g., Page 2, Dosage)"
            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
          />
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
            rows={4}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] text-center">
            <div className="text-zinc-400 text-lg">No comments yet</div>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getCommentTypeIcon(comment.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{comment.authorName}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {comment.sectionReference && (
                    <div className="text-xs text-violet-400 mb-2">
                      📍 {comment.sectionReference}
                    </div>
                  )}
                  <div className="text-sm text-zinc-300">{comment.content}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};