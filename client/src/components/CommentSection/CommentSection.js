import React, { useState } from 'react';
import { FiThumbsUp, FiTrash2 } from 'react-icons/fi';
import { addComment, deleteComment, likeComment } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import './CommentSection.css';

const CommentSection = ({ videoId, comments: initialComments }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      setLoading(true);
      const res = await addComment(videoId, { text: newComment });
      setComments([res.data.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) return;

    try {
      await likeComment(commentId);
      setComments(
        comments.map((c) =>
          c._id === commentId
            ? { ...c, likes: c.likes.includes(user.id)
                ? c.likes.filter(id => id !== user.id)
                : [...c.likes, user.id]
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-count">{comments.length} Comments</h3>

      {isAuthenticated && (
        <form className="comment-form" onSubmit={handleAddComment}>
          <img
            src={user.avatar}
            alt={user.username}
            className="comment-avatar"
          />
          <div className="comment-input-container">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comment-input"
            />
            <div className="comment-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNewComment('')}
                disabled={!newComment.trim()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newComment.trim() || loading}
              >
                {loading ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            <img
              src={comment.user.avatar}
              alt={comment.user.username}
              className="comment-avatar"
            />
            <div className="comment-content">
              <div className="comment-header">
                <span className="comment-author">{comment.user.username}</span>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="comment-text">{comment.text}</p>
              <div className="comment-footer">
                <button
                  className={`comment-like-btn ${
                    comment.likes.includes(user?.id) ? 'active' : ''
                  }`}
                  onClick={() => handleLikeComment(comment._id)}
                >
                  <FiThumbsUp size={16} />
                  <span>{comment.likes.length}</span>
                </button>
                {user && comment.user._id === user.id && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDeleteComment(comment._id)}
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
