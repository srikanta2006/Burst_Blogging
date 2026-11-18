// src/context/UserProfileContext.jsx

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const UserProfileContext = createContext(null);

export function useUserProfiles() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error('useUserProfiles must be used within a UserProfileProvider');
  }
  return ctx;
}

export function UserProfileProvider({ children }) {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState({});
  const fetchedIdsRef = useRef(new Set());
  const inFlightIdsRef = useRef(new Set());

  // Subscribe in real time to the currently logged-in user's Firestore profile.
  // Any profile photo or username change immediately propagates across the entire app.
  useEffect(() => {
    if (!currentUser?.uid) return;

    const uid = currentUser.uid;
    const userRef = doc(db, 'users', uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        fetchedIdsRef.current.add(uid);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfiles((prev) => ({
            ...prev,
            [uid]: {
              ...data,
              uid,
              username: data.username || currentUser.displayName || currentUser.email || '',
              profilePictureURL:
                data.profilePictureURL !== undefined
                  ? data.profilePictureURL
                  : currentUser.photoURL || '',
            },
          }));
        } else {
          setProfiles((prev) => ({
            ...prev,
            [uid]: {
              uid,
              username: currentUser.displayName || currentUser.email || '',
              profilePictureURL: currentUser.photoURL || '',
            },
          }));
        }
      },
      (error) => {
        console.error('Error listening to current user profile:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch and cache a single user's profile from Firestore if not already cached or in flight
  const ensureUserProfile = useCallback(async (userId) => {
    if (!userId || typeof userId !== 'string') return;
    if (fetchedIdsRef.current.has(userId) || inFlightIdsRef.current.has(userId)) {
      return;
    }

    inFlightIdsRef.current.add(userId);
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      fetchedIdsRef.current.add(userId);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfiles((prev) => ({
          ...prev,
          [userId]: {
            ...data,
            uid: userId,
          },
        }));
      } else {
        setProfiles((prev) => ({
          ...prev,
          [userId]: { uid: userId, missing: true },
        }));
      }
    } catch (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
    } finally {
      inFlightIdsRef.current.delete(userId);
    }
  }, []);

  // Batch helper for pages rendering lists of posts or comments
  const ensureUserProfiles = useCallback(
    async (userIds) => {
      if (!Array.isArray(userIds) || userIds.length === 0) return;
      const uniqueIds = Array.from(new Set(userIds.filter((id) => typeof id === 'string' && id.trim())));
      await Promise.all(uniqueIds.map((id) => ensureUserProfile(id)));
    },
    [ensureUserProfile]
  );

  // Optimistically update the cached profile immediately on save
  const updateCachedProfile = useCallback((userId, partialData) => {
    if (!userId) return;
    fetchedIdsRef.current.add(userId);
    setProfiles((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { uid: userId }),
        ...partialData,
      },
    }));
  }, []);

  const currentUserProfile = currentUser?.uid ? profiles[currentUser.uid] || null : null;

  const value = {
    profiles,
    currentUserProfile,
    ensureUserProfile,
    ensureUserProfiles,
    updateCachedProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
