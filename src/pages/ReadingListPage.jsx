// src/pages/ReadingListPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight } from 'lucide-react';
import Avatar from '../components/Avatar';
import BookmarkButton from '../components/BookmarkButton';
import styles from './ReadingListPage.module.css';

function ReadingListPage() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const {
    profiles,
    currentUserProfile,
    currentUserProfileLoaded,
    ensureUserProfiles,
  } = useUserProfiles();

  // Extract valid, unique post IDs in reverse order (most recently saved first)
  const orderedIds = useMemo(() => {
    const rawList = Array.isArray(currentUserProfile?.readingList)
      ? currentUserProfile.readingList
      : [];
    const seen = new Set();
    const cleaned = [];
    for (let i = rawList.length - 1; i >= 0; i -= 1) {
      const id = rawList[i];
      if (typeof id === 'string' && id.trim() && !id.includes('/') && !seen.has(id.trim())) {
        const trimmed = id.trim();
        seen.add(trimmed);
        cleaned.push(trimmed);
      }
    }
    return cleaned;
  }, [currentUserProfile?.readingList]);

  const readingListKey = orderedIds.join(',');

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const createSnippet = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = (div.textContent || div.innerText || '').trim();
    return text.length > 180 ? `${text.substring(0, 180)}...` : text;
  };

  useEffect(() => {
    if (!currentUser) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    if (!currentUserProfileLoaded) {
      setLoadingPosts(true);
      return;
    }

    if (!readingListKey) {
      setPosts([]);
      setError(null);
      setLoadingPosts(false);
      return;
    }

    let cancelled = false;
    const idsToFetch = readingListKey.split(',');

    const fetchSavedPosts = async () => {
      setError(null);
      setLoadingPosts((prev) => (prev ? true : false));
      try {
        const results = await Promise.allSettled(
          idsToFetch.map((postId) => getDoc(doc(db, 'posts', postId)))
        );

        if (cancelled) return;

        let failedCount = 0;
        const fetchedPosts = [];

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const snap = result.value;
            if (snap.exists()) {
              const data = snap.data();
              if (data.status === 'published' || data.authorId === currentUser.uid) {
                fetchedPosts.push({ id: snap.id, ...data });
              }
            }
          } else {
            failedCount += 1;
            console.error('Failed to fetch saved post:', result.reason);
          }
        });

        setPosts(fetchedPosts);

        if (failedCount > 0 && fetchedPosts.length === 0) {
          setError('Unable to load your reading list right now. Please try again.');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading reading list:', err);
          setError('Unable to load your reading list right now. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingPosts(false);
        }
      }
    };

    fetchSavedPosts();
    return () => {
      cancelled = true;
    };
  }, [currentUser, currentUserProfileLoaded, readingListKey]);

  useEffect(() => {
    const authorIds = posts.map((p) => p.authorId).filter(Boolean);
    if (authorIds.length > 0) {
      ensureUserProfiles(authorIds);
    }
  }, [posts, ensureUserProfiles]);

  if (!currentUserProfileLoaded || loadingPosts) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingState}>Loading your reading list...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>My Reading List</h1>
          <p className={styles.subtitle}>Articles you&apos;ve saved to read later.</p>
        </div>
        {posts.length > 0 && (
          <span className={styles.countBadge}>
            <Bookmark size={14} />
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </span>
        )}
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {posts.length > 0 ? (
        <div className={styles.postList}>
          {posts.map((post) => {
            const authorName = profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';
            const snippet = createSnippet(post.content);
            const dateStr = formatDate(post.publishedAt || post.createdAt);
            const primaryCategory = post.categories?.[0];

            return (
              <article key={post.id} className={styles.postItem}>
                <div className={styles.cardTopRow}>
                  <div className={styles.cardHeaderMain}>
                    {primaryCategory && (
                      <Link
                        to={`/category/${encodeURIComponent(primaryCategory)}`}
                        className={styles.categoryBadge}
                      >
                        {primaryCategory}
                      </Link>
                    )}
                    <Link to={`/post/${post.id}`} className={styles.postTitle}>
                      {post.title}
                    </Link>
                  </div>
                  <div className={styles.actions}>
                    <BookmarkButton postId={post.id} />
                  </div>
                </div>

                {snippet && <p className={styles.postSnippet}>{snippet}</p>}

                <footer className={styles.cardFooter}>
                  <div className={styles.authorInfo}>
                    <Link
                      to={`/profile/${post.authorId}`}
                      className={styles.avatarLink}
                      aria-label={`View ${authorName}'s profile`}
                    >
                      <Avatar
                        userId={post.authorId}
                        src={post.authorProfilePic}
                        name={authorName}
                        className={styles.authorImage}
                        size="xs"
                      />
                    </Link>
                    <div className={styles.authorMeta}>
                      <Link to={`/profile/${post.authorId}`} className={styles.authorLink}>
                        {authorName}
                      </Link>
                      {dateStr && <span className={styles.postDate}>&middot; {dateStr}</span>}
                    </div>
                  </div>
                  <Link to={`/post/${post.id}`} className={styles.readMoreLink}>
                    <span>Read Article</span>
                    <ArrowRight size={15} />
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <Bookmark size={26} />
            </div>
            <h2 className={styles.emptyTitle}>Your reading list is empty</h2>
            <p className={styles.emptyText}>
              Save articles you want to revisit by clicking the bookmark icon on any post.
            </p>
            <Link to="/home" className={styles.exploreButton}>
              <span>Explore Articles</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )
      )}
    </div>
  );
}

export default ReadingListPage;
