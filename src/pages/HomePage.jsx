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
import { Flame, Clock, Eye, Sparkles, BookOpen, PenSquare, ArrowRight } from 'lucide-react';

function calculateReadTime(content) {
  if (!content) return '1 min read';
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

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
      return isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            postsQuery = query(
              collection(db, 'posts'),
              where('authorId', 'in', followingList.slice(0, 30)),
              where('status', '==', 'published')
            );
          } else {
            setPosts([]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching user following list:', err);
          setPosts([]);
          setLoading(false);
          return;
        }
      } else {
        postsQuery = query(collection(db, 'posts'), where('status', '==', 'published'));
      }
      unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          let fetchedPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          fetchedPosts.sort(
            (a, b) =>
              (b.publishedAt?.toDate?.()?.getTime() || 0) -
              (a.publishedAt?.toDate?.()?.getTime() || 0)
          );
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
    return () => {
      if (unsubscribe) unsubscribe();
    };
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
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = (div.textContent || div.innerText || '').trim();
    return text.length > 220 ? `${text.substring(0, 220)}...` : text;
  };

  const showTrending = feedType === 'global' && Boolean(topPost);
  const topPostAuthorName = topPost
    ? profiles[topPost.authorId]?.username || topPost.authorUsername || 'Anonymous'
    : 'Anonymous';

  return (
    <div className={styles.pageLayout}>
      {/* Top Tab Navigation */}
      <div className={styles.tabContainer}>
        <div className={styles.tabList} role="tablist" aria-label="Feed selection">
          <button
            role="tab"
            aria-selected={feedType === 'global'}
            onClick={() => setFeedType('global')}
            className={`${styles.tab} ${feedType === 'global' ? styles.tabActive : ''}`}
          >
            <Sparkles size={16} />
            <span>Global Feed</span>
          </button>
          <button
            role="tab"
            aria-selected={feedType === 'following'}
            onClick={() => setFeedType('following')}
            disabled={!currentUser}
            className={`${styles.tab} ${feedType === 'following' ? styles.tabActive : ''}`}
            title={!currentUser ? 'Log in to view followed authors' : 'Stories from authors you follow'}
          >
            <BookOpen size={16} />
            <span>Following</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout:
          - Desktop view: Stories flow on the LEFT (col 1), Trending Post is on the RIGHT (col 2, sticky)
          - Mobile view: Trending Post appears FIRST (at top), Stories flow SECOND underneath
      */}
      <div className={`${styles.contentGrid} ${!showTrending ? styles.contentGridSolo : ''}`}>
        {/* Stories Feed Column (Desktop: Left, Mobile: Second) */}
        <main className={styles.mainFeedSection}>
          {loading ? (
            <div className={styles.skeletonFeed}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonAvatar}></div>
                    <div className={styles.skeletonMeta}>
                      <div className={styles.skeletonLineShort}></div>
                      <div className={styles.skeletonLineTiny}></div>
                    </div>
                  </div>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLineHalf}></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <Sparkles size={36} />
              </div>
              <h3 className={styles.emptyStateTitle}>
                {feedType === 'following' ? 'No Stories in Your Feed Yet' : 'No Stories Published Yet'}
              </h3>
              <p className={styles.emptyStateDesc}>
                {feedType === 'following'
                  ? 'Follow great authors in the Global feed to see their latest stories appear here.'
                  : 'Be the pioneer to publish the first story on Burst! Inspire writers across the globe.'}
              </p>
              {feedType === 'following' ? (
                <button onClick={() => setFeedType('global')} className={styles.primaryActionBtn}>
                  <Sparkles size={16} />
                  <span>Explore Global Feed</span>
                </button>
              ) : (
                <Link to="/create-post" className={styles.primaryActionBtn}>
                  <PenSquare size={16} />
                  <span>Write a Story</span>
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.mainFeed}>
              {showTrending && (
                <div className={styles.feedSectionHeader}>
                  <h2 className={styles.feedHeading}>Latest Stories</h2>
                  <span className={styles.feedCount}>{posts.length} {posts.length === 1 ? 'story' : 'stories'}</span>
                </div>
              )}

              {posts.map((post) => {
                const authorName =
                  profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';
                const primaryCategory = Array.isArray(post.categories) && post.categories[0];

                return (
                  <article key={post.id} className={styles.postItem}>
                    <header className={styles.postHeader}>
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
                            size="sm"
                          />
                        </Link>
                        <div className={styles.authorDetails}>
                          <Link to={`/profile/${post.authorId}`} className={styles.authorName}>
                            {authorName}
                          </Link>
                          <div className={styles.metaRow}>
                            <span className={styles.postDate}>{formatDate(post.publishedAt)}</span>
                            <span className={styles.dotSeparator}>•</span>
                            <span className={styles.readTime}>
                              <Clock size={12} />
                              {calculateReadTime(post.content)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {primaryCategory && (
                        <Link
                          to={`/category/${encodeURIComponent(primaryCategory)}`}
                          className={styles.categoryPill}
                        >
                          {primaryCategory}
                        </Link>
                      )}
                    </header>

                    <Link to={`/post/${post.id}`} className={styles.postTitle}>
                      <h2>{post.title}</h2>
                    </Link>

                    <p className={styles.postSnippet}>{createSnippet(post.content)}</p>

                    <footer className={styles.postFooter}>
                      <Link to={`/post/${post.id}`} className={styles.readMoreLink}>
                        <span>Read Story</span>
                        <ArrowRight size={15} />
                      </Link>
                      <div className={styles.actions}>
                        <LikeButton postId={post.id} />
                        <BookmarkButton postId={post.id} />
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Trending Post Section (Desktop: Right Sticky Sidebar, Mobile: First on Top) */}
        {showTrending && topPost && (
          <aside className={styles.sidebar} aria-label="Trending Story">
            <div className={styles.trendingPostContainer}>
              <header className={styles.sectionHeader}>
                <div className={styles.sectionHeaderTitle}>
                  <Flame size={18} className={styles.flameIcon} />
                  <span>Trending on Burst</span>
                </div>
                {typeof topPost.viewCount === 'number' && (
                  <span className={styles.trendingViews}>
                    <Eye size={13} />
                    {topPost.viewCount} reads
                  </span>
                )}
              </header>

              <div className={styles.trendingPostContent}>
                <div className={styles.authorInfo}>
                  <Link
                    to={`/profile/${topPost.authorId}`}
                    className={styles.avatarLink}
                    aria-label={`View ${topPostAuthorName}'s profile`}
                  >
                    <Avatar
                      userId={topPost.authorId}
                      src={topPost.authorProfilePic}
                      name={topPostAuthorName}
                      className={styles.authorImage}
                      size="sm"
                    />
                  </Link>
                  <div className={styles.authorDetails}>
                    <Link to={`/profile/${topPost.authorId}`} className={styles.authorName}>
                      {topPostAuthorName}
                    </Link>
                    <div className={styles.metaRow}>
                      <span className={styles.postDate}>{formatDate(topPost.publishedAt)}</span>
                      <span className={styles.dotSeparator}>•</span>
                      <span className={styles.readTime}>
                        <Clock size={12} />
                        {calculateReadTime(topPost.content)}
                      </span>
                    </div>
                  </div>
                </div>

                {Array.isArray(topPost.categories) && topPost.categories[0] && (
                  <div className={styles.categoryBadgeRow}>
                    <Link
                      to={`/category/${encodeURIComponent(topPost.categories[0])}`}
                      className={styles.categoryPill}
                    >
                      {topPost.categories[0]}
                    </Link>
                  </div>
                )}

                <Link to={`/post/${topPost.id}`} className={styles.trendingTitleLink}>
                  <h3 className={styles.trendingPostTitle}>{topPost.title}</h3>
                </Link>

                <p className={styles.trendingSnippet}>{createSnippet(topPost.content)}</p>

                <footer className={styles.trendingFooter}>
                  <Link to={`/post/${topPost.id}`} className={styles.trendingReadMore}>
                    <span>Read Full Story</span>
                    <ArrowRight size={15} />
                  </Link>
                  <div className={styles.actions}>
                    <LikeButton postId={topPost.id} />
                    <BookmarkButton postId={topPost.id} />
                  </div>
                </footer>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default HomePage;
