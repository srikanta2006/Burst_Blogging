// src/components/FollowButton.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, writeBatch, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import styles from './FollowButton.module.css'; // Import the new stylesheet

function FollowButton({ profileUserId }) {
  const { currentUser } = useAuth();
  const { currentUserProfile } = useUserProfiles();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!currentUser || !profileUserId) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setIsFollowing(Boolean(docSnap.data()?.following?.includes(profileUserId)));
      }
    });
    return () => unsub();
  }, [currentUser, profileUserId]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('You must be logged in to follow users.');
      return;
    }
    const currentUserRef = doc(db, 'users', currentUser.uid);
    const profileUserRef = doc(db, 'users', profileUserId);
    const willFollow = !isFollowing;

    try {
      // Use writeBatch to ensure atomic synchronization between follower and following counts
      const batch = writeBatch(db);
      if (willFollow) {
        batch.update(currentUserRef, { following: arrayUnion(profileUserId) });
        batch.update(profileUserRef, { followers: arrayUnion(currentUser.uid) });
      } else {
        batch.update(currentUserRef, { following: arrayRemove(profileUserId) });
        batch.update(profileUserRef, { followers: arrayRemove(currentUser.uid) });
      }
      await batch.commit();

      // If following, send a notification to the followed user
      if (willFollow) {
        const notificationRef = collection(db, 'users', profileUserId, 'notifications');
        await addDoc(notificationRef, {
          type: 'follow',
          fromUser: currentUserProfile?.username || currentUser.displayName || currentUser.email?.split('@')[0] || 'A writer',
          fromUserId: currentUser.uid,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Failed to update follow status:', err);
    }
  };
  
  if (!currentUser || currentUser.uid === profileUserId) {
    return null;
  }

  return (
    <button 
      onClick={handleFollowToggle} 
      className={`${styles.button} ${isFollowing ? styles.unfollowButton : styles.followButton}`}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}

export default FollowButton;
