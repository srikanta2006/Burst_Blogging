// src/components/LikeButton.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import styles from './ActionButtons.module.css';
import { Heart } from 'lucide-react';

function LikeButton({ postId }) {
  const { currentUser } = useAuth();
  const { currentUserProfile } = useUserProfiles();
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
        likes: willLike ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
      });

      // If user is liking the post and is not the author, send notification
      if (willLike) {
        let authorId = postData?.authorId;
        let postTitle = postData?.title;

        if (!authorId) {
          const snap = await getDoc(postRef);
          if (snap.exists()) {
            authorId = snap.data().authorId;
            postTitle = snap.data().title;
          }
        }

        if (authorId && authorId !== currentUser.uid) {
          const senderName =
            currentUserProfile?.username ||
            currentUser.displayName ||
            currentUser.email?.split('@')[0] ||
            'A reader';

          const notificationRef = collection(db, 'users', authorId, 'notifications');
          await addDoc(notificationRef, {
            type: 'like',
            fromUser: senderName,
            fromUserId: currentUser.uid,
            postId: postId,
            postTitle: postTitle || 'your story',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to update like status:', err);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`${styles.iconButton} ${isLiked ? styles.liked : ''}`}
      title={isLiked ? 'Unlike' : 'Like'}
      aria-label={isLiked ? 'Unlike story' : 'Like story'}
    >
      <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
    </button>
  );
}

export default LikeButton;
