// src/pages/CategoryPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useUserProfiles } from '../context/UserProfileContext';
import Avatar from '../components/Avatar';

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
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => post.status === 'published');
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
    return <div className="text-center py-20">Loading posts for &quot;{categoryName}&quot;...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Category: {categoryName}</h1>
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => {
            const authorName = profiles[post.authorId]?.username || post.authorUsername || 'Anonymous';
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <Link to={`/post/${post.id}`} className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                  {post.title}
                </Link>
                <div className="flex items-center gap-3 mt-3 mb-4">
                  <Link to={`/profile/${post.authorId}`} aria-label={`View ${authorName}'s profile`}>
                    <Avatar
                      userId={post.authorId}
                      src={post.authorProfilePic}
                      name={authorName}
                      className="w-8 h-8"
                      size="xs"
                    />
                  </Link>
                  <Link to={`/profile/${post.authorId}`} className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                    {authorName}
                  </Link>
                </div>
                <Link to={`/post/${post.id}`} className="text-sm font-semibold text-indigo-600 hover:underline">
                  Read More &rarr;
                </Link>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600">No posts found in this category.</p>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;
