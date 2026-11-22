// src/pages/SinglePostPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, onSnapshot, limit, increment, updateDoc } from 'firebase/firestore';
import { useUserProfiles } from '../context/UserProfileContext';
import Avatar from '../components/Avatar';
import CommentSection from '../components/CommentSection';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import FollowButton from '../components/FollowButton';
import ShareButton from '../components/ShareButton';
import styles from './SinglePostPage.module.css';
import { Clock, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';

function calculateReadTime(content) {
  if (!content) return '1 min read';
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function SinglePostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [morePosts, setMorePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { profiles, ensureUserProfile } = useUserProfiles();

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

  // Reading progress bar tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeMorePosts = null;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists() && isMounted) {
          const postData = { id: postSnap.id, ...postSnap.data() };
          setPost(postData);

          if (postData.authorId) {
            ensureUserProfile(postData.authorId);
          }

          const viewed = sessionStorage.getItem(postId);
          if (!viewed) {
            try {
              await updateDoc(postRef, { viewCount: increment(1) });
              sessionStorage.setItem(postId, 'true');
            } catch (viewErr) {
              console.warn('Could not increment view count:', viewErr);
            }
          }

          if (postData.authorId) {
            const authorRef = doc(db, 'users', postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists() && isMounted) {
              setAuthor(authorSnap.data());
            }

            const morePostsQuery = query(
              collection(db, 'posts'),
              where('authorId', '==', postData.authorId),
              where('status', '==', 'published'),
              limit(4)
            );
            unsubscribeMorePosts = onSnapshot(
              morePostsQuery,
              (snapshot) => {
                if (!isMounted) return;
                const otherPosts = snapshot.docs
                  .map((d) => ({ id: d.id, ...d.data() }))
                  .filter((p) => p.id !== postId);
                setMorePosts(otherPosts.slice(0, 3));
              },
              (err) => {
                console.error('Error loading related posts:', err);
              }
            );
          }
        } else if (isMounted) {
          setPost(null);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
      if (unsubscribeMorePosts) unsubscribeMorePosts();
    };
  }, [postId, ensureUserProfile]);

  if (loading) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <p>Loading Story...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.notFoundCard}>
          <AlertCircle size={40} className={styles.alertIcon} />
          <h2>Story Not Found</h2>
          <p>The story you are looking for may have been removed or is unavailable.</p>
          <Link to="/home" className={styles.backButton}>
            <ArrowLeft size={16} />
            <span>Back to Stories</span>
          </Link>
        </div>
      </div>
    );
  }

  const liveAuthor = post.authorId ? profiles[post.authorId] : null;
  const authorName = liveAuthor?.username || author?.username || post.authorUsername || 'Anonymous';
  const authorBio = liveAuthor?.bio ?? author?.bio ?? '';
  const primaryCategory = Array.isArray(post.categories) && post.categories[0];

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div
        className={styles.progressBar}
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <div className={styles.pageLayout}>
        <article className={styles.mainArticle}>
          {/* Back link */}
          <div className={styles.topNavRow}>
            <Link to="/home" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Back to Feed</span>
            </Link>
          </div>

          <header className={styles.header}>
            {primaryCategory && (
              <div className={styles.categoryRow}>
                <Link
                  to={`/category/${encodeURIComponent(primaryCategory)}`}
                  className={styles.categoryPill}
                >
                  {primaryCategory}
                </Link>
              </div>
            )}

            <h1 className={styles.title}>{post.title}</h1>

            <div className={styles.headerAuthorRow}>
              <Link to={`/profile/${post.authorId}`} aria-label={`View ${authorName}'s profile`}>
                <Avatar
                  userId={post.authorId}
                  src={author?.profilePictureURL || post.authorProfilePic}
                  name={authorName}
                  className={styles.headerAuthorAvatar}
                  size="md"
                />
              </Link>
              <div className={styles.headerAuthorDetails}>
                <Link to={`/profile/${post.authorId}`} className={styles.headerAuthorName}>
                  {authorName}
                </Link>
                <div className={styles.metaRow}>
                  {post.publishedAt && (
                    <span className={styles.headerPostDate}>{formatDate(post.publishedAt)}</span>
                  )}
                  <span className={styles.dotSeparator}>•</span>
                  <span className={styles.readTime}>
                    <Clock size={13} />
                    {calculateReadTime(post.content)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} />

          <footer className={styles.actionsFooter}>
            <LikeButton postId={post.id} />
            <BookmarkButton postId={post.id} />
            <ShareButton title={post.title} text={`Check out this article by ${authorName}: "${post.title}"`} />
          </footer>

          <hr className={styles.divider} />

          <CommentSection
            postId={post.id}
            postAuthorId={post.authorId}
            postTitle={post.title}
          />
        </article>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.authorSpotlight}>
              <Link to={`/profile/${post.authorId}`} aria-label={`View ${authorName}'s profile`}>
                <Avatar
                  userId={post.authorId}
                  src={author?.profilePictureURL || post.authorProfilePic}
                  name={authorName}
                  className={styles.authorImage}
                  size="lg"
                />
              </Link>
              <Link to={`/profile/${post.authorId}`} className={styles.authorNameLink}>
                <h3 className={styles.authorName}>{authorName}</h3>
              </Link>
              {authorBio && (
                <p className={styles.authorBio}>
                  {authorBio.substring(0, 120)}
                  {authorBio.length > 120 ? '...' : ''}
                </p>
              )}
              <div style={{ marginTop: '0.75rem' }}>
                <FollowButton profileUserId={post.authorId} />
              </div>
            </div>
          </div>

          {morePosts.length > 0 && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarHeader}>
                <BookOpen size={17} />
                <h3 className={styles.sidebarTitle}>More from {authorName}</h3>
              </div>
              <div className={styles.morePostsList}>
                {morePosts.map((p) => (
                  <Link key={p.id} to={`/post/${p.id}`} className={styles.morePostsItem}>
                    <p className={styles.morePostTitle}>{p.title}</p>
                    <span className={styles.morePostDate}>{formatDate(p.publishedAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export default SinglePostPage;
