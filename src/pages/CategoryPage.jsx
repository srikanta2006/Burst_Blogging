// src/pages/CategoryPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useUserProfiles } from '../context/UserProfileContext';
import Avatar from '../components/Avatar';
import styles from './CategoryPage.module.css';
import { ArrowRight } from 'lucide-react';

function CategoryPage() {
  const { categoryName } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profiles, ensureUserProfiles } = useUserProfiles();

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'posts'),
      where('categories', 'array-contains', categoryName)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const categoryPosts = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((post) => post.status === 'published');
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
          Loading posts for &ldquo;{categoryName}&rdquo;...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Category: <span className={styles.categoryHighlight}>{categoryName}</span>
        </h1>
      </header>

      <div className={styles.postList}>
        {posts.length > 0 ? (
          posts.map((post) => {
            const authorName =
              profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';
            return (
              <article key={post.id} className={styles.postCard}>
                <Link to={`/post/${post.id}`} className={styles.postTitle}>
                  {post.title}
                </Link>
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
                  <Link to={`/profile/${post.authorId}`} className={styles.authorName}>
                    {authorName}
                  </Link>
                </div>
                <Link to={`/post/${post.id}`} className={styles.readMoreLink}>
                  <span>Read Article</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </article>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p>No published stories found in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;
