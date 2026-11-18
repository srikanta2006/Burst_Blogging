// src/pages/ProfilePage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import FollowButton from '../components/FollowButton';
import ShareButton from '../components/ShareButton';
import Avatar from '../components/Avatar';
import { isValidImageSrc } from '../utils/imageUtils';
import styles from './ProfilePage.module.css';
import { Edit2, MapPin } from 'lucide-react';

function ProfilePage() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverError, setCoverError] = useState(false);

  const isOwnProfile = currentUser && currentUser.uid === userId;

  const formatPostDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    setLoading(true);
    setCoverError(false);

    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(
      userDocRef,
      (userDocSnap) => {
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data());
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading profile:', error);
        setLoading(false);
      }
    );

    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      where('status', '==', 'published')
    );
    const unsubPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error('Error loading profile posts:', error);
      }
    );

    return () => {
      unsubUser();
      unsubPosts();
    };
  }, [userId]);

  if (loading) return <div className="text-center py-20">Loading Profile...</div>;
  if (!profile) return <div className="text-center py-20">User not found.</div>;

  const hasCover = isValidImageSrc(profile.coverPhotoURL) && !coverError;

  return (
    <div>
      <header className={styles.profileHeader}>
        <div className={styles.coverPhoto}>
          {hasCover && (
            <img
              src={profile.coverPhotoURL.trim()}
              alt=""
              onError={() => setCoverError(true)}
            />
          )}
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.mainInfo}>
            <Avatar
              userId={userId}
              src={profile.profilePictureURL}
              name={profile.username}
              className={styles.profilePicture}
              size="lg"
            />
            <div className="flex-grow" />
            <div className={styles.nameAndActions}>
              {isOwnProfile ? (
                <Link to="/edit-profile" className={styles.editButton}>
                  <Edit2 size={16} /> Edit Profile
                </Link>
              ) : (
                <FollowButton profileUserId={userId} />
              )}
              <ShareButton title={profile.username} text={`Check out ${profile.username}'s profile on Burst!`} />
            </div>
          </div>
        </div>
        <div className="px-10 pb-6">
          <h1 className={styles.username}>{profile.username}</h1>
          {profile.location && (
            <p className="flex items-center gap-2 mt-2 text-gray-500">
              <MapPin size={16} /> {profile.location}
            </p>
          )}
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}><strong>{posts.length}</strong> Posts</div>
          <div className={styles.statItem}><strong>{profile.followers?.length || 0}</strong> Followers</div>
          <div className={styles.statItem}><strong>{profile.following?.length || 0}</strong> Following</div>
        </div>
      </header>

      <section>
        <h2 className={styles.postsHeader}>Published Posts</h2>
        <div className={styles.postGrid}>
          {posts.map(post => (
            <Link to={`/post/${post.id}`} key={post.id} className={styles.card}>
              <div>
                <h3 className={styles.cardTitle}>{post.title}</h3>
              </div>
              <p className={styles.cardDate}>
                {formatPostDate(post.publishedAt)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
