// src/pages/ProfilePage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import FollowButton from '../components/FollowButton';
import ShareButton from '../components/ShareButton';
import Avatar from '../components/Avatar';
import { isValidImageSrc } from '../utils/imageUtils';
import styles from './ProfilePage.module.css';
import { Edit2, MapPin, Globe, Calendar, Eye, Heart, PenSquare, X, BookOpen } from 'lucide-react';

function getSafeExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return {
        href: parsed.href,
        label: parsed.hostname.replace(/^www\./, ''),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function ProfilePage() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { profiles, ensureUserProfiles } = useUserProfiles();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverError, setCoverError] = useState(false);
  const [connectionsModalTab, setConnectionsModalTab] = useState(null); // 'followers' | 'following' | null

  const isOwnProfile = Boolean(currentUser && currentUser.uid === userId);

  const formatPostDate = (timestamp) => {
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

  const formatJoinedDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const createSnippet = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = (div.textContent || div.innerText || '').trim();
    return text.length > 160 ? `${text.substring(0, 160)}...` : text;
  };

  useEffect(() => {
    setLoading(true);
    setCoverError(false);
    setConnectionsModalTab(null);

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
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        fetched.sort(
          (a, b) =>
            (b.publishedAt?.toDate?.()?.getTime() || 0) -
            (a.publishedAt?.toDate?.()?.getTime() || 0)
        );
        setPosts(fetched);
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

  const followerIds = useMemo(
    () => (Array.isArray(profile?.followers) ? profile.followers.filter(Boolean) : []),
    [profile?.followers]
  );

  const followingIds = useMemo(
    () => (Array.isArray(profile?.following) ? profile.following.filter(Boolean) : []),
    [profile?.following]
  );

  const activeConnectionIds = useMemo(() => {
    if (connectionsModalTab === 'followers') return followerIds;
    if (connectionsModalTab === 'following') return followingIds;
    return [];
  }, [connectionsModalTab, followerIds, followingIds]);

  // Pre-fetch profiles for people shown in the Followers/Following modal
  useEffect(() => {
    if (connectionsModalTab && activeConnectionIds.length > 0) {
      ensureUserProfiles(activeConnectionIds);
    }
  }, [connectionsModalTab, activeConnectionIds, ensureUserProfiles]);

  // Close connections modal on Escape key
  useEffect(() => {
    if (!connectionsModalTab) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setConnectionsModalTab(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectionsModalTab]);

  const scrollToStories = () => {
    const el = document.getElementById('published-stories-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.statusCard} role="status" aria-live="polite">
          <p className={styles.statusText}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.statusCard}>
          <h1 className={styles.statusTitle}>Profile Not Found</h1>
          <p className={styles.statusText}>The user profile you are looking for does not exist.</p>
          <Link to="/home" className={styles.primaryCta}>
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const hasCover = isValidImageSrc(profile.coverPhotoURL) && !coverError;
  const websiteLink = getSafeExternalUrl(profile.website);
  const joinedLabel = formatJoinedDate(profile.createdAt);
  const displayName = profile.username || 'Anonymous Writer';

  return (
    <div className={styles.pageContainer}>
      {/* Two-Column Responsive Layout: Left = Profile, Right = Stories */}
      <div className={styles.twoColumnLayout}>
        {/* Left Column: Author Overview Card (Sticky on Desktop) */}
        <aside className={styles.profileColumn} aria-label="Author profile overview">
          <div className={styles.profileCard}>
            <div className={styles.coverBanner}>
              {hasCover && (
                <img
                  src={profile.coverPhotoURL.trim()}
                  alt=""
                  className={styles.coverImage}
                  onError={() => setCoverError(true)}
                />
              )}
            </div>

            <div className={styles.profileBody}>
              <div className={styles.topRow}>
                <div className={styles.avatarFrame}>
                  <Avatar
                    userId={userId}
                    src={profile.profilePictureURL}
                    name={displayName}
                    className={styles.profilePicture}
                    size="lg"
                  />
                </div>

                <div className={styles.actionsGroup}>
                  {isOwnProfile ? (
                    <Link to="/edit-profile" className={styles.editButton}>
                      <Edit2 size={15} aria-hidden="true" />
                      <span>Edit</span>
                    </Link>
                  ) : (
                    <FollowButton profileUserId={userId} />
                  )}
                  <ShareButton
                    title={displayName}
                    text={`Check out ${displayName}'s profile on Burst!`}
                  />
                </div>
              </div>

              <div className={styles.identityBlock}>
                <h1 className={styles.username}>{displayName}</h1>
                {profile.headline && <p className={styles.headline}>{profile.headline}</p>}
                {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

                {(profile.location || websiteLink || joinedLabel) && (
                  <ul className={styles.metaList}>
                    {profile.location && (
                      <li className={styles.metaItem}>
                        <MapPin size={14} aria-hidden="true" />
                        <span>{profile.location}</span>
                      </li>
                    )}
                    {websiteLink && (
                      <li className={styles.metaItem}>
                        <Globe size={14} aria-hidden="true" />
                        <a
                          href={websiteLink.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.metaLink}
                        >
                          {websiteLink.label}
                        </a>
                      </li>
                    )}
                    {joinedLabel && (
                      <li className={styles.metaItem}>
                        <Calendar size={14} aria-hidden="true" />
                        <span>Joined {joinedLabel}</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* 3 Clickable Metrics */}
            <div className={styles.statsBar} role="group" aria-label="Profile statistics">
              <button
                type="button"
                onClick={scrollToStories}
                className={styles.statButton}
                title="View published stories"
              >
                <span className={styles.statValue}>{posts.length}</span>
                <span className={styles.statLabelRow}>Stories</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionsModalTab('followers')}
                className={styles.statButton}
                aria-haspopup="dialog"
                title="View followers"
              >
                <span className={styles.statValue}>{followerIds.length}</span>
                <span className={styles.statLabelRow}>Followers</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionsModalTab('following')}
                className={styles.statButton}
                aria-haspopup="dialog"
                title="View following"
              >
                <span className={styles.statValue}>{followingIds.length}</span>
                <span className={styles.statLabelRow}>Following</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Author's Stories Feed */}
        <section className={styles.storiesColumn} aria-labelledby="published-stories-heading">
          <div className={styles.postsSectionHeader}>
            <div className={styles.postsHeadingGroup}>
              <h2 id="published-stories-heading" className={styles.postsHeading}>
                Stories
              </h2>
              <span className={styles.postsCount}>{posts.length}</span>
            </div>
          </div>

          {posts.length > 0 ? (
            <div className={styles.postList}>
              {posts.map((post) => {
                const snippet = createSnippet(post.content);
                const dateLabel = formatPostDate(post.publishedAt || post.createdAt);
                const category = post.categories?.[0];

                return (
                  <article key={post.id} className={styles.postCard}>
                    <Link to={`/post/${post.id}`} className={styles.cardMainLink}>
                      {category && <span className={styles.postCategory}>{category}</span>}
                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      {snippet && <p className={styles.cardSnippet}>{snippet}</p>}
                    </Link>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardDate}>{dateLabel}</span>
                      <div className={styles.cardMetrics}>
                        <span className={styles.cardMetric} title={`${post.viewCount || 0} views`}>
                          <Eye size={14} aria-hidden="true" />
                          <span>{post.viewCount || 0}</span>
                        </span>
                        <span className={styles.cardMetric} title={`${post.likes?.length || 0} likes`}>
                          <Heart size={14} aria-hidden="true" />
                          <span>{post.likes?.length || 0}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyPosts}>
              <BookOpen size={36} className={styles.emptyIcon} aria-hidden="true" />
              <h3 className={styles.emptyPostsTitle}>
                {isOwnProfile ? 'You haven’t published any stories yet' : 'No published stories yet'}
              </h3>
              <p className={styles.emptyPostsText}>
                {isOwnProfile
                  ? 'Share your thoughts and ideas with the community by writing your first article.'
                  : `${displayName} hasn’t published any stories yet.`}
              </p>
              {isOwnProfile && (
                <Link to="/create-post" className={styles.primaryCta}>
                  <PenSquare size={16} aria-hidden="true" />
                  <span>Write Your First Story</span>
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Followers / Following Modal */}
      {connectionsModalTab && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setConnectionsModalTab(null)}
        >
          <div
            className={styles.modalDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="connections-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="connections-modal-title" className={styles.modalTitle}>
                {displayName}
              </h2>
              <button
                type="button"
                onClick={() => setConnectionsModalTab(null)}
                className={styles.modalCloseButton}
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.modalTabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={connectionsModalTab === 'followers'}
                onClick={() => setConnectionsModalTab('followers')}
                className={`${styles.modalTab} ${
                  connectionsModalTab === 'followers' ? styles.modalTabActive : ''
                }`}
              >
                Followers ({followerIds.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={connectionsModalTab === 'following'}
                onClick={() => setConnectionsModalTab('following')}
                className={`${styles.modalTab} ${
                  connectionsModalTab === 'following' ? styles.modalTabActive : ''
                }`}
              >
                Following ({followingIds.length})
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeConnectionIds.length > 0 ? (
                <ul className={styles.peopleList}>
                  {activeConnectionIds.map((personId) => {
                    const person = profiles[personId];
                    const personName = person?.username || 'Loading...';
                    const personSub = person?.headline || person?.bio || '';

                    return (
                      <li key={personId} className={styles.personRow}>
                        <Link
                          to={`/profile/${personId}`}
                          className={styles.personLink}
                          onClick={() => setConnectionsModalTab(null)}
                        >
                          <Avatar
                            userId={personId}
                            name={person?.username}
                            className={styles.personAvatar}
                          />
                          <div className={styles.personMeta}>
                            <p className={styles.personName}>{personName}</p>
                            {personSub && <p className={styles.personSub}>{personSub}</p>}
                          </div>
                        </Link>
                        <FollowButton profileUserId={personId} />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.modalEmpty}>
                  {connectionsModalTab === 'followers'
                    ? 'No followers yet.'
                    : 'Not following anyone yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
