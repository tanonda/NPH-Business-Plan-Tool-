'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/components/useCurrentUser';

type ApprovalComment = {
  id: string;
  comment?: string;
  body?: string;
  message?: string;
  text?: string;
  createdAt?: string;
  commentType?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  author?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
};

type ApprovalCommentsPanelProps = {
  planId: string;
  planTitle?: string;
  onCommentAdded?: () => void;
};

function getCommentText(comment: ApprovalComment) {
  return comment.comment || comment.body || comment.message || comment.text || '';
}

function getCommentAuthor(comment: ApprovalComment) {
  const person = comment.user || comment.author;

  if (!person) return 'Unknown user';

  return person.name || person.email || 'Unknown user';
}

function getCommentRole(comment: ApprovalComment) {
  const person = comment.user || comment.author;

  return person?.role || '';
}

export function ApprovalCommentsPanel({
  planId,
  planTitle,
  onCommentAdded
}: ApprovalCommentsPanelProps) {
  const { user } = useCurrentUser();

  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('GENERAL_COMMENT');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState('');

  const role = user?.role || 'VIEWER';

  const canComment = useMemo(() => {
    return role === 'ADMIN' || role === 'PLANNER' || role === 'APPROVER' || role === 'REVIEWER' || role === 'ACCOUNTING' || role === 'FINANCE' || role === 'BUDGET_OFFICER' || role === 'DONOR_MANAGER';
  }, [role]);

  async function loadComments() {
    if (!planId) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/plans/${planId}/comments`, {
        cache: 'no-store'
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Could not load comments.');
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setComments(data);
      } else if (Array.isArray(data.comments)) {
        setComments(data.comments);
      } else {
        setComments([]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load comments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();

    if (!canComment) {
      setMessage('Your role can view comments but cannot add comments.');
      return;
    }

    const cleanComment = commentText.trim();

    if (!cleanComment) {
      setMessage('Write a comment first.');
      return;
    }

    setPosting(true);
    setMessage('Posting comment...');

    try {
      const res = await fetch(`/api/plans/${planId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: cleanComment,
          body: cleanComment,
          message: cleanComment,
          commentType
        })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Could not post comment.');
      }

      setCommentText('');
      setCommentType('GENERAL_COMMENT');
      setMessage('Comment added.');
      await loadComments();
      onCommentAdded?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Approval Comments</h2>
          <p className="muted">
            {planTitle ? `Comments and review notes for ${planTitle}.` : 'Comments and review notes for this plan.'}
          </p>
        </div>

        <div className="hero-badges">
          <span className="badge">{comments.length} comments</span>
          <span className={`badge ${canComment ? 'good' : 'warn'}`}>
            {canComment ? 'Can comment' : 'Read only'}
          </span>
        </div>
      </div>

      {canComment ? (
        <form onSubmit={submitComment} style={{ marginTop: 16 }}>
          <div className="grid cols-2">
            <label>Comment type
              <select value={commentType} onChange={(event) => setCommentType(event.target.value)}>
                <option value="GENERAL_COMMENT">General comment</option>
                <option value="REQUESTED_CHANGE">Requested change</option>
                <option value="APPROVAL_NOTE">Approval note</option>
                <option value="REJECTION_NOTE">Rejection note</option>
              </select>
            </label>
          </div>
          <label>
            Add comment
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={4}
              placeholder="Write review notes, approval feedback, required corrections, or planning comments..."
              disabled={posting}
            />
          </label>

          <div className="actions" style={{ marginTop: 10 }}>
            <button type="submit" disabled={posting || !commentText.trim()}>
              {posting ? 'Posting...' : 'Add comment'}
            </button>

            <button type="button" className="secondary" onClick={() => void loadComments()}>
              Refresh
            </button>
          </div>
        </form>
      ) : (
        <div className="notice" style={{ marginTop: 16 }}>
          <strong>Read-only comments</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Your role can view approval comments but cannot add new comments.
          </p>
        </div>
      )}

      {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <p className="muted">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="muted">No comments yet.</p>
        ) : (
          <div className="stack">
            {comments.map((comment) => (
              <article key={comment.id} className="card">
                <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{getCommentAuthor(comment)}</strong>
                    {comment.commentType && (
                      <span className="badge" style={{ marginLeft: 8 }}>
                        {String(comment.commentType).replace(/_/g, ' ')}
                      </span>
                    )}
                    {getCommentRole(comment) && (
                      <span className="badge" style={{ marginLeft: 8 }}>
                        {getCommentRole(comment)}
                      </span>
                    )}
                  </div>

                  <span className="muted">
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                  </span>
                </div>

                <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {getCommentText(comment)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
