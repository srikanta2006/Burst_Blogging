// src/pages/PostEditor.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { db } from '../firebase/config';
import { collection, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import BurstEditor from '../components/BurstEditor';
import styles from './PostEditor.module.css';
import { ArrowLeft, Clock, FileText, Send, Save, AlertCircle, Sparkles, Tag } from 'lucide-react';

const SUGGESTED_TOPICS = ['Technology', 'Design', 'Productivity', 'Culture', 'AI', 'Startups', 'Life'];

function PostEditor() {
  const { postId } = useParams();
  const isEditing = Boolean(postId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useAuth();
  const { currentUserProfile } = useUserProfiles();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && currentUser) {
      const fetchPostData = async () => {
        const postRef = doc(db, 'posts', postId);
        try {
          const postSnap = await getDoc(postRef);
          if (postSnap.exists()) {
            const postData = postSnap.data();
            if (postData.authorId === currentUser.uid) {
              setTitle(postData.title || '');
              setContent(postData.content || '');
              setCategories(postData.categories ? postData.categories.join(', ') : '');
            } else {
              setError('Permission Denied: You are not the author of this post.');
            }
          } else {
            setError('This post does not exist.');
          }
        } catch (err) {
          setError('Failed to load post data.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchPostData();
    }
  }, [postId, isEditing, currentUser]);

  const authorName =
    currentUserProfile?.username ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Writer';
  const authorPhoto = currentUserProfile?.profilePictureURL || currentUser?.photoURL || '';

  const handleToggleCategory = (topic) => {
    const currentList = categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    let updated;
    if (currentList.includes(topic)) {
      updated = currentList.filter((c) => c !== topic);
    } else {
      updated = [...currentList, topic];
    }
    setCategories(updated.join(', '));
  };

  const handleSave = async (status) => {
    setError(null);
    if (!currentUser) return;
    if (!title.trim()) {
      setError('Story title cannot be empty.');
      return;
    }

    const categoriesArray = categories
      .split(',')
      .map((cat) => cat.trim())
      .filter((cat) => cat !== '');

    setIsSaving(true);

    try {
      // Retrieve latest user profile data from Firestore to ensure current photo & username are saved with the post
      let authorSavedPhoto = authorPhoto;
      let authorSavedName = authorName;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.profilePictureURL !== undefined) {
            authorSavedPhoto = userData.profilePictureURL;
          }
          if (userData.username) {
            authorSavedName = userData.username;
          }
        }
      } catch (userErr) {
        console.warn('Could not fetch user profile from Firestore, using auth fallback:', userErr);
      }

      const postData = {
        title: title.trim(),
        content: content || '',
        categories: categoriesArray,
        status,
        authorId: currentUser.uid,
        authorUsername: authorSavedName,
        authorProfilePic: authorSavedPhoto,
        lastUpdatedAt: serverTimestamp(),
      };

      if (isEditing) {
        const postRef = doc(db, 'posts', postId);
        const originalPost = await getDoc(postRef);
        if (status === 'published' && !originalPost.data()?.publishedAt) {
          postData.publishedAt = serverTimestamp();
        }
        await updateDoc(postRef, postData);
      } else {
        postData.createdAt = serverTimestamp();
        postData.publishedAt = status === 'published' ? serverTimestamp() : null;
        postData.likes = [];
        postData.viewCount = 0;
        await addDoc(collection(db, 'posts'), postData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save story.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const cleanText = content.replace(/<[^>]*>/g, ' ').trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>Loading Story Studio...</p>
        </div>
      </div>
    );
  }

  if (error && isEditing) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.errorBox}>
          <AlertCircle size={36} className={styles.errorIcon} />
          <p>{error}</p>
          <Link to="/dashboard" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const primaryCategory = categories.split(',')[0]?.trim() || '';

  return (
    <div className={styles.editorLayout}>
      <main className={styles.mainContent}>
        <div className={styles.topNavRow}>
          <Link to="/dashboard" className={styles.dashboardBreadcrumb}>
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <div className={styles.editorBrandBadge}>
            <Sparkles size={14} />
            <span>Burst Native Writer</span>
          </div>
        </div>

        {/* Clean Story Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Story Title..."
          className={styles.titleInput}
        />

        {/* Custom Native Burst Studio Editor */}
        <div className={styles.editorContainer}>
          <BurstEditor
            value={content}
            onChange={setContent}
            placeholder="Tell your story... Ideas come alive when shared."
            title={title}
            authorName={authorName}
            authorPhoto={authorPhoto}
            authorId={currentUser?.uid}
            category={primaryCategory}
          />
        </div>
      </main>

      {/* Sidebar with Publishing Controls and Live Insights */}
      <aside className={styles.sidebar}>
        <div className={styles.settingsCard}>
          <h2 className={styles.settingsHeader}>{isEditing ? 'Update Story' : 'Story Publishing'}</h2>

          {/* Live Story Metrics */}
          <div className={styles.storyMetrics}>
            <div className={styles.metricItem}>
              <FileText size={15} />
              <span>{wordCount} words</span>
            </div>
            <div className={styles.metricItem}>
              <Clock size={15} />
              <span>~{readTimeMin} min read</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="categories" className={styles.label}>
                Topics & Categories
              </label>
              <Tag size={13} className={styles.tagIcon} />
            </div>
            <input
              id="categories"
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="e.g. Technology, Design, AI"
              className={styles.input}
            />
            <span className={styles.hintText}>Separate multiple topics with commas</span>

            {/* Quick Topic Suggestions */}
            <div className={styles.topicSuggestions}>
              <span className={styles.topicLabel}>Suggested:</span>
              <div className={styles.topicPills}>
                {SUGGESTED_TOPICS.map((topic) => {
                  const isSelected = categories
                    .split(',')
                    .map((c) => c.trim().toLowerCase())
                    .includes(topic.toLowerCase());
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleToggleCategory(topic)}
                      className={`${styles.suggestionPill} ${
                        isSelected ? styles.suggestionPillActive : ''
                      }`}
                    >
                      {isSelected ? `✓ ${topic}` : `+ ${topic}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={isSaving}
              className={styles.publishButton}
            >
              <Send size={16} />
              <span>{isSaving ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish Story'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className={styles.draftButton}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save as Draft'}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default PostEditor;
