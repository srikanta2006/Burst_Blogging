// src/components/CommentSection.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import styles from './CommentSection.module.css';

function CommentSection({ postId, postAuthorId, postTitle }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { currentUser } = useAuth();
  const { profiles, currentUserProfile, ensureUserProfiles } = useUserProfiles();

  const formatCommentDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  useEffect(() => {
    if (!postId) return;
    const commentsQuery = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('Error listening to comments:', error);
      }
    );
    return () => unsubscribe();
  }, [postId]);

  useEffect(() => {
    const authorIds = comments.map((c) => c.authorId).filter(Boolean);
    if (authorIds.length > 0) {
      ensureUserProfiles(authorIds);
    }
  }, [comments, ensureUserProfiles]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const commenterName = currentUserProfile?.username || currentUser.displayName || currentUser.email;
    const commenterPhoto =
      currentUserProfile?.profilePictureURL !== undefined
        ? currentUserProfile.profilePictureURL
        : currentUser.photoURL || '';

    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: newComment,
        authorId: currentUser.uid,
        authorUsername: commenterName,
        authorProfilePic: commenterPhoto,
        createdAt: serverTimestamp()
      });
      setNewComment('');

      if (postAuthorId && postAuthorId !== currentUser.uid) {
        const notificationRef = collection(db, 'users', postAuthorId, 'notifications');
        await addDoc(notificationRef, {
          type: 'comment',
          fromUser: commenterName,
          fromUserId: currentUser.uid,
          postId: postId,
          postTitle: postTitle,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  return (
    <div className={styles.commentSection}>
      <h2 className={styles.commentHeader}>Join the Conversation</h2>
      {currentUser ? (
        <form onSubmit={handleAddComment} className={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a thoughtful comment..."
            rows="4"
            className={styles.commentTextarea}
            required
          />
          <button type="submit" className={styles.commentSubmitButton}>Post Comment</button>
        </form>
      ) : (
        <p>You must be <Link to="/login" className="text-blue-600 hover:underline font-semibold">logged in</Link> to comment.</p>
      )}
      <div className={styles.commentList}>
        {comments.map(comment => {
          const commentAuthorName = profiles[comment.authorId]?.username || comment.authorUsername || 'Anonymous';
          return (
            <div key={comment.id} className={styles.comment}>
              <Link to={comment.authorId ? `/profile/${comment.authorId}` : '#'} aria-label={`View ${commentAuthorName}'s profile`}>
                <Avatar
                  userId={comment.authorId}
                  src={comment.authorProfilePic}
                  name={commentAuthorName}
                  className={styles.commentAuthorImage}
                />
              </Link>
              <div className={styles.commentBody}>
                <p>
                  <Link to={comment.authorId ? `/profile/${comment.authorId}` : '#'} className={styles.commentAuthorName}>
                    {commentAuthorName}
                  </Link>
                  <span className={styles.commentDate}>{formatCommentDate(comment.createdAt)}</span>
                </p>
                <p className={styles.commentText}>{comment.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CommentSection;
