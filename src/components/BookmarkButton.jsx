// src/components/BookmarkButton.jsx
import { useState } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import styles from './ActionButtons.module.css';
import { Bookmark } from 'lucide-react';

function BookmarkButton({ postId }) {
  const { currentUser } = useAuth();
  const { currentUserProfile, updateCachedProfile } = useUserProfiles();
  const [isUpdating, setIsUpdating] = useState(false);

  const currentReadingList = Array.isArray(currentUserProfile?.readingList)
    ? currentUserProfile.readingList
    : [];
  const isBookmarked = Boolean(postId && currentReadingList.includes(postId));

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || !postId || isUpdating) return;

    const willBookmark = !isBookmarked;
    const previousList = currentReadingList;
    const optimisticList = willBookmark
      ? Array.from(new Set([...previousList, postId]))
      : previousList.filter((id) => id !== postId);

    // Instant optimistic update across Navbar, Feed, SinglePost, and ReadingList
    updateCachedProfile(currentUser.uid, { readingList: optimisticList });
    setIsUpdating(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userRef,
        {
          readingList: willBookmark ? arrayUnion(postId) : arrayRemove(postId),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to update reading list:', error);
      // Roll back optimistic state on write failure
      updateCachedProfile(currentUser.uid, { readingList: previousList });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBookmark}
      disabled={isUpdating}
      className={`${styles.iconButton} ${isBookmarked ? styles.bookmarked : ''}`}
      title={isBookmarked ? 'Remove from reading list' : 'Add to reading list'}
      aria-label={isBookmarked ? 'Remove from reading list' : 'Add to reading list'}
      aria-pressed={isBookmarked}
    >
      <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
    </button>
  );
}

export default BookmarkButton;
