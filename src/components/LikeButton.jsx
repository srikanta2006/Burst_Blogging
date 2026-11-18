// src/components/LikeButton.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import styles from './ActionButtons.module.css'; // Use the correct, dedicated stylesheet
import { Heart } from 'lucide-react';

function LikeButton({ postId }) {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    if (!currentUser || !postId) return;
    const postRef = doc(db, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPostData(data);
        setIsLiked(Boolean(data?.likes?.includes(currentUser.uid)));
      }
    });
    return unsubscribe;
  }, [postId, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !postId) return;
    const postRef = doc(db, 'posts', postId);
    const willLike = !isLiked;

    try {
      await updateDoc(postRef, {
        likes: willLike ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid)
      });

      // If user is liking the post and is not the author, send notification
      if (willLike && postData?.authorId && postData.authorId !== currentUser.uid) {
        const notificationRef = collection(db, 'users', postData.authorId, 'notifications');
        await addDoc(notificationRef, {
          type: 'like',
          fromUser: currentUser.displayName || currentUser.email,
          fromUserId: currentUser.uid,
          postId: postId,
          postTitle: postData.title || 'Untitled Post',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Failed to update like status:', err);
    }
  };

  return (
    <button onClick={handleLike} className={`${styles.iconButton} ${isLiked ? styles.liked : ''}`} title={isLiked ? 'Unlike' : 'Like'}>
      <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
    </button>
  );
}
export default LikeButton;
