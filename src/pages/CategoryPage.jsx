// src/pages/CategoryPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useUserProfiles } from '../context/UserProfileContext';
import Avatar from '../components/Avatar';
import styles from './CategoryPage.module.css';
import { ArrowRight, ArrowLeft, Clock, Sparkles, PenSquare } from 'lucide-react';

function calculateReadTime(content) {
  if (!content) return '1 min read';
  const text = content.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function CategoryPage() {
  const { categoryName } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profiles, ensureUserProfiles } = useUserProfiles();

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

  const createSnippet = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = (div.textContent || div.innerText || '').trim();
    return text.length > 180 ? `${text.substring(0, 180)}...` : text;
  };

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'posts'),
      where('categories', 'array-contains', categoryName)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const categoryPosts = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.status === 'published');
        categoryPosts.sort(
          (a, b) =>
            (b.publishedAt?.toDate?.()?.getTime() || 0) -
            (a.publishedAt?.toDate?.()?.getTime() || 0)
        );
        setPosts(categoryPosts);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading category posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [categoryName]);

  useEffect(() => {
    const authorIds = posts.map((p) => p.authorId).filter(Boolean);
    if (authorIds.length > 0) {
      ensureUserProfiles(authorIds);
    }
  }, [posts, ensureUserProfiles]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingState} role="status">
          <div className={styles.spinner} />
          <p>Loading posts in &ldquo;{categoryName}&rdquo;...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topNavRow}>
        <Link to="/home" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </Link>
      </div>

      <header className={styles.header}>
        <div className={styles.categoryBadge}>Topic</div>
        <h1 className={styles.title}>
          <span className={styles.categoryHighlight}>{categoryName}</span>
        </h1>
        <p className={styles.subtitle}>
          {posts.length} {posts.length === 1 ? 'story' : 'stories'} published in this topic
        </p>
      </header>

      <div className={styles.postList}>
        {posts.length > 0 ? (
          posts.map((post) => {
            const authorName =
              profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';
            return (
              <article key={post.id} className={styles.postCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.authorRow}>
                    <Link to={`/profile/${post.authorId}`} aria-label={`View ${authorName}'s profile`}>
                      <Avatar
                        userId={post.authorId}
                        src={post.authorProfilePic}
                        name={authorName}
                        className={styles.authorAvatar}
                        size="xs"
                      />
                    </Link>
                    <div className={styles.authorMeta}>
                      <Link to={`/profile/${post.authorId}`} className={styles.authorName}>
                        {authorName}
                      </Link>
                      <div className={styles.metaRow}>
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>•</span>
                        <span className={styles.readTime}>
                          <Clock size={12} />
                          {calculateReadTime(post.content)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Link to={`/post/${post.id}`} className={styles.postTitle}>
                  {post.title}
                </Link>

                <p className={styles.snippet}>{createSnippet(post.content)}</p>

                <div className={styles.cardFooter}>
                  <Link to={`/post/${post.id}`} className={styles.readMoreLink}>
                    <span>Read Article</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Sparkles size={32} />
            </div>
            <h3>No stories in this topic yet</h3>
            <p>Be the first author to write a story about &ldquo;{categoryName}&rdquo;!</p>
            <Link to="/create-post" className={styles.createBtn}>
              <PenSquare size={16} />
              <span>Write a Story</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;
