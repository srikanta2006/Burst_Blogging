// src/pages/ReadingListPage.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import BookmarkButton from '../components/BookmarkButton';
import styles from './ReadingListPage.module.css';

function ReadingListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { profiles, ensureUserProfiles } = useUserProfiles();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      async (userDoc) => {
        try {
          if (userDoc.exists()) {
            const readingListIds = userDoc.data().readingList || [];
            if (readingListIds.length > 0) {
              // Chunk into slices of 30 to respect Firestore 'in' query limits
              const chunks = [];
              for (let i = 0; i < readingListIds.length; i += 30) {
                chunks.push(readingListIds.slice(i, i + 30));
              }

              const snapshots = await Promise.all(
                chunks.map((chunk) =>
                  getDocs(query(collection(db, 'posts'), where('__name__', 'in', chunk)))
                )
              );

              const savedPosts = snapshots.flatMap((snap) =>
                snap.docs.map((d) => ({ id: d.id, ...d.data() }))
              );
              setPosts(savedPosts);
            } else {
              setPosts([]);
            }
          }
        } catch (err) {
          console.error('Error loading reading list posts:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error listening to reading list:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const authorIds = posts.map((p) => p.authorId).filter(Boolean);
    if (authorIds.length > 0) {
      ensureUserProfiles(authorIds);
    }
  }, [posts, ensureUserProfiles]);

  if (loading) return <div className="text-center py-20">Loading Reading List...</div>;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>My Reading List</h1>
        <p className={styles.subtitle}>Articles you&apos;ve saved to read later.</p>
      </header>

      {posts.length > 0 ? (
        <div className={styles.postList}>
          {posts.map(post => {
            const authorName = profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';
            return (
              <div key={post.id} className={styles.postItem}>
                <div className={styles.postDetails}>
                  <Link to={`/post/${post.id}`} className={styles.postTitle}>{post.title}</Link>
                  <div className={styles.authorInfo}>
                    <Link to={`/profile/${post.authorId}`} aria-label={`View ${authorName}'s profile`}>
                      <Avatar
                        userId={post.authorId}
                        src={post.authorProfilePic}
                        name={authorName}
                        className={styles.authorImage}
                        size="xs"
                      />
                    </Link>
                    <Link to={`/profile/${post.authorId}`} className="hover:underline">
                      <span>{authorName}</span>
                    </Link>
                  </div>
                </div>
                <BookmarkButton postId={post.id} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className="text-xl font-bold mb-2">Your reading list is empty.</h2>
          <p className="text-gray-600">Save articles by clicking the bookmark icon.</p>
        </div>
      )}
    </div>
  );
}

export default ReadingListPage;
