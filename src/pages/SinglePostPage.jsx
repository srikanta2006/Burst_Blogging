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

function SinglePostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [morePosts, setMorePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profiles, ensureUserProfile } = useUserProfiles();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    } catch {
      return '';
    }
  };

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

  if (loading) return <div className="text-center py-20">Loading Article...</div>;
  if (!post) return <div className="text-center py-20">Post not found.</div>;

  const liveAuthor = post.authorId ? profiles[post.authorId] : null;
  const authorName = liveAuthor?.username || author?.username || post.authorUsername || 'Anonymous';
  const authorBio = liveAuthor?.bio ?? author?.bio ?? '';

  return (
    <div className={styles.pageLayout}>
      <article className={styles.mainArticle}>
        <header className={styles.header}>
          <p className={styles.category}>{post.categories?.[0] || 'Uncategorized'}</p>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.headerAuthorRow}>
            <Link to={`/profile/${post.authorId}`} aria-label={`View ${authorName}'s profile`}>
              <Avatar
                userId={post.authorId}
                src={author?.profilePictureURL || post.authorProfilePic}
                name={authorName}
                className={styles.headerAuthorAvatar}
              />
            </Link>
            <div className={styles.headerAuthorDetails}>
              <Link to={`/profile/${post.authorId}`} className={styles.headerAuthorName}>
                {authorName}
              </Link>
              {post.publishedAt && (
                <p className={styles.headerPostDate}>{formatDate(post.publishedAt)}</p>
              )}
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
                size="md"
              />
            </Link>
            <Link to={`/profile/${post.authorId}`}><h3 className={styles.authorName}>{authorName}</h3></Link>
            <p className={styles.authorBio}>{authorBio.substring(0, 100)}{authorBio.length > 100 ? '...' : ''}</p>
            <FollowButton profileUserId={post.authorId} />
          </div>
        </div>
        {morePosts.length > 0 && (
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>More from {authorName}</h3>
            <div className={styles.morePostsList}>
              {morePosts.map(p => (
                <Link key={p.id} to={`/post/${p.id}`} className={styles.morePostsItem}>
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default SinglePostPage;
