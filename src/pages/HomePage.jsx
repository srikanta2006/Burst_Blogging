// src/pages/HomePage.jsx

import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import styles from './HomePage.module.css';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import Avatar from '../components/Avatar';
import { TrendingUp } from 'lucide-react';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [topPost, setTopPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState('global');
  const { currentUser } = useAuth();
  const { profiles, ensureUserProfiles } = useUserProfiles();

  // Helper for safe timestamp formatting
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Derive Top Trending Post from published posts (eliminates unindexed Firestore compound query error)
  useEffect(() => {
    if (feedType !== 'global' || posts.length === 0) {
      setTopPost(null);
      return;
    }
    const sortedByViews = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    setTopPost(sortedByViews[0] || null);
  }, [posts, feedType]);

  // Data fetching logic for the main feed
  useEffect(() => {
    setLoading(true);
    let unsubscribe;
    const fetchFeed = async () => {
      let postsQuery;
      if (feedType === 'following' && currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const followingList = userDocSnap.data()?.following || [];
          if (followingList.length > 0) {
            postsQuery = query(collection(db, 'posts'), where('authorId', 'in', followingList.slice(0, 30)), where('status', '==', 'published'));
          } else {
            setPosts([]); setLoading(false); return;
          }
        } catch (err) {
          console.error('Error fetching user following list:', err);
          setPosts([]); setLoading(false); return;
        }
      } else {
        postsQuery = query(collection(db, 'posts'), where('status', '==', 'published'));
      }
      unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          let fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedPosts.sort((a, b) => (b.publishedAt?.toDate() || 0) - (a.publishedAt?.toDate() || 0));
          setPosts(fetchedPosts);
          setLoading(false);
        },
        (error) => {
          console.error('Error listening to feed posts:', error);
          setLoading(false);
        }
      );
    };
    fetchFeed();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [feedType, currentUser]);

  // Pre-fetch author profiles via shared UserProfileContext cache
  useEffect(() => {
    const authorIds = posts.map((post) => post.authorId).filter(Boolean);
    if (topPost?.authorId) authorIds.push(topPost.authorId);
    if (authorIds.length > 0) {
      ensureUserProfiles(authorIds);
    }
  }, [posts, topPost, ensureUserProfiles]);

  const createSnippet = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  return (
    <div className={styles.pageLayout}>
      <main>
        <div className={styles.tabContainer}>
          <div className={styles.tabList}>
            <button onClick={() => setFeedType('global')} className={`${styles.tab} ${feedType === 'global' ? styles.tabActive : ''}`}>Global</button>
            <button onClick={() => setFeedType('following')} disabled={!currentUser} className={`${styles.tab} ${feedType === 'following' ? styles.tabActive : ''}`}>Following</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading Feed...</div>
        ) : (
          <div className={styles.mainFeed}>
            {posts.map(post => {
              const authorName = profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';

              return (
                <article key={post.id} className={styles.postItem}>
                  <header className={styles.postHeader}>
                    <Link to={`/post/${post.id}`} className={styles.postTitle}>
                      <h2>{post.title}</h2>
                    </Link>
                    <div className={styles.authorInfo}>
                      <Link to={`/profile/${post.authorId}`} className={styles.avatarLink} aria-label={`View ${authorName}'s profile`}>
                        <Avatar
                          userId={post.authorId}
                          src={post.authorProfilePic}
                          name={authorName}
                          className={styles.authorImage}
                        />
                      </Link>
                      <div className={styles.authorDetails}>
                        <Link to={`/profile/${post.authorId}`} className={styles.authorName}>{authorName}</Link>
                        <p className={styles.postDate}>{formatDate(post.publishedAt)}</p>
                      </div>
                    </div>
                  </header>
                  <p className={styles.postSnippet}>{createSnippet(post.content).substring(0, 250)}...</p>
                  <footer className={styles.postFooter}>
                    <Link to={`/post/${post.id}`} className={styles.readMoreLink}>Read More &rarr;</Link>
                    <div className={styles.actions}><LikeButton postId={post.id} /><BookmarkButton postId={post.id} /></div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Trending Post sidebar */}
      {feedType === 'global' && topPost && (() => {
        const topPostAuthorName = profiles[topPost.authorId]?.username || topPost.authorUsername || 'Anonymous';

        return (
          <aside className={`${styles.sidebar} hidden lg:block`}>
            <div className={styles.trendingPostContainer}>
              <header className={styles.sectionHeader}><TrendingUp size={24} /><h2 className={styles.sectionTitle}>Trending Post</h2></header>
              <div className={styles.trendingPostContent}>
                <header className={styles.postHeader}>
                  <div className={styles.authorInfo}>
                    <Link to={`/profile/${topPost.authorId}`} className={styles.avatarLink} aria-label={`View ${topPostAuthorName}'s profile`}>
                      <Avatar
                        userId={topPost.authorId}
                        src={topPost.authorProfilePic}
                        name={topPostAuthorName}
                        className={styles.authorImage}
                      />
                    </Link>
                    <div className={styles.authorDetails}>
                      <Link to={`/profile/${topPost.authorId}`}><p className={styles.authorName}>{topPostAuthorName}</p></Link>
                      <p className={styles.postDate}>{formatDate(topPost.publishedAt)}</p>
                    </div>
                  </div>
                  <h1 className={styles.postTitle} style={{ marginTop: '1rem' }}>{topPost.title}</h1>
                </header>
                <div dangerouslySetInnerHTML={{ __html: topPost.content }} />
              </div>
            </div>
          </aside>
        );
      })()}
    </div>
  );
}

export default HomePage;
