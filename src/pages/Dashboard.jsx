// src/pages/Dashboard.jsx

import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import {
  Edit2,
  Trash2,
  Eye,
  Heart,
  MessageSquare,
  Send,
  TrendingUp,
  Users,
  FileText,
  Award,
  BarChart3,
  ExternalLink,
  BookOpen,
  Clock,
  Sparkles,
  Search,
  CheckCircle,
} from 'lucide-react';

function stripHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

function countWords(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/);
  return words[0] === '' ? 0 : words.length;
}

function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'views' | 'likes' | 'comments'
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const { currentUserProfile } = useUserProfiles();

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

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      postsQuery,
      async (snapshot) => {
        const userPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        userPosts.sort(
          (a, b) =>
            (b.createdAt?.toDate?.()?.getTime() || 0) -
            (a.createdAt?.toDate?.()?.getTime() || 0)
        );
        if (!isMounted) return;
        setPosts(userPosts);
        setLoading(false);

        // Fetch comment counts in parallel
        const publishedPosts = userPosts.filter((p) => p.status === 'published');
        const results = await Promise.allSettled(
          publishedPosts.map(async (post) => {
            const commentsCol = collection(db, 'posts', post.id, 'comments');
            const commentsSnap = await getCountFromServer(commentsCol);
            return [post.id, commentsSnap.data().count];
          })
        );

        if (!isMounted) return;
        const counts = {};
        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            const [postId, count] = res.value;
            counts[postId] = count;
          }
        });
        setCommentCounts(counts);
      },
      (error) => {
        console.error('Error loading dashboard posts:', error);
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (err) {
        console.error('Failed to delete post:', err);
      }
    }
  };

  const handlePublish = async (postId) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to publish post:', err);
    }
  };

  // Deep Creator Analytics Computations
  const analytics = useMemo(() => {
    const publishedPosts = posts.filter((p) => p.status === 'published');
    const draftCount = posts.length - publishedPosts.length;
    const pubCount = publishedPosts.length;

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalWords = 0;

    // Word counts and read times map
    const postStatsMap = {};

    posts.forEach((p) => {
      const plainText = stripHtml(p.content);
      const words = countWords(plainText);
      const readMinutes = Math.max(1, Math.ceil(words / 200));
      const views = Number(p.viewCount) || 0;
      const likes = Array.isArray(p.likes) ? p.likes.length : 0;
      const comments = commentCounts[p.id] || 0;

      postStatsMap[p.id] = {
        words,
        readMinutes,
        views,
        likes,
        comments,
      };

      if (p.status === 'published') {
        totalViews += views;
        totalLikes += likes;
        totalComments += comments;
        totalWords += words;
      }
    });

    const avgViews = pubCount > 0 ? Math.round(totalViews / pubCount) : 0;
    const avgLikes = pubCount > 0 ? (totalLikes / pubCount).toFixed(1) : '0';
    const avgComments = pubCount > 0 ? (totalComments / pubCount).toFixed(1) : '0';
    const avgWordsPerStory = pubCount > 0 ? Math.round(totalWords / pubCount) : 0;
    const avgReadTimeMinutes = pubCount > 0 ? Math.max(1, Math.ceil(avgWordsPerStory / 200)) : 0;

    // Engagement & Conversion metrics
    const engagementRate =
      totalViews > 0 ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1) : '0.0';
    const likeConversionRate =
      totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0.0';
    const commentConversionRate =
      totalViews > 0 ? ((totalComments / totalViews) * 100).toFixed(1) : '0.0';

    // Total estimated reader attention generated (minutes)
    const totalReadingMinutesGenerated = Math.round(
      publishedPosts.reduce((sum, p) => {
        const stats = postStatsMap[p.id] || { views: 0, readMinutes: 1 };
        return sum + stats.views * stats.readMinutes;
      }, 0)
    );

    // Velocity: stories published in the past 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentPublishedCount = publishedPosts.filter((p) => {
      const time =
        p.publishedAt?.toDate?.()?.getTime() || p.createdAt?.toDate?.()?.getTime() || 0;
      return time >= thirtyDaysAgo;
    }).length;

    // Pipeline completion rate
    const pipelineCompletionRate =
      posts.length > 0 ? Math.round((pubCount / posts.length) * 100) : 0;

    // Ranked Leaderboard: Top 5 published stories
    const leaderboard = [...publishedPosts]
      .map((p) => {
        const s = postStatsMap[p.id] || { views: 0, likes: 0, comments: 0, readMinutes: 1 };
        const score = s.views + s.likes * 4 + s.comments * 6;
        const postEngRate = s.views > 0 ? (((s.likes + s.comments) / s.views) * 100).toFixed(1) : '0.0';
        return {
          ...p,
          views: s.views,
          likesCount: s.likes,
          commentsCount: s.comments,
          score,
          engagementRate: postEngRate,
        };
      })
      .sort((a, b) => b.score - a.score || b.views - a.views)
      .slice(0, 5);

    const maxLeaderboardViews = Math.max(...leaderboard.map((p) => p.views), 1);
    const topPost = leaderboard[0] || null;

    // Category performance breakdown
    const catMap = {};
    publishedPosts.forEach((p) => {
      const cats =
        Array.isArray(p.categories) && p.categories.length > 0
          ? p.categories
          : ['General'];
      cats.forEach((cat) => {
        if (!catMap[cat]) catMap[cat] = { name: cat, posts: 0, views: 0, likes: 0 };
        catMap[cat].posts += 1;
        catMap[cat].views += Number(p.viewCount) || 0;
        catMap[cat].likes += Array.isArray(p.likes) ? p.likes.length : 0;
      });
    });

    const categories = Object.values(catMap)
      .sort((a, b) => b.views - a.views || b.posts - a.posts)
      .slice(0, 4);
    const maxCatViews = Math.max(...categories.map((c) => c.views), 1);

    return {
      publishedCount: pubCount,
      draftCount,
      totalViews,
      totalLikes,
      totalComments,
      totalWords,
      avgViews,
      avgLikes,
      avgComments,
      avgWordsPerStory,
      avgReadTimeMinutes,
      engagementRate,
      likeConversionRate,
      commentConversionRate,
      totalReadingMinutesGenerated,
      recentPublishedCount,
      pipelineCompletionRate,
      topPost,
      leaderboard,
      maxLeaderboardViews,
      categories,
      maxCatViews,
      postStatsMap,
    };
  }, [posts, commentCounts]);

  const filteredAndSortedPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = posts.filter((p) => {
      // Filter by status
      if (statusFilter === 'published' && p.status !== 'published') return false;
      if (statusFilter === 'draft' && p.status !== 'draft') return false;

      // Filter by search query
      if (q) {
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const categoryMatch = Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes(q));
        if (!titleMatch && !categoryMatch) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'views') {
        return (Number(b.viewCount) || 0) - (Number(a.viewCount) || 0);
      }
      if (sortBy === 'likes') {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      if (sortBy === 'comments') {
        return (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0);
      }
      return (
        (b.createdAt?.toDate?.()?.getTime() || 0) -
        (a.createdAt?.toDate?.()?.getTime() || 0)
      );
    });
  }, [posts, statusFilter, sortBy, searchQuery, commentCounts]);

  const followersCount = currentUserProfile?.followers?.length || 0;
  const followingCount = currentUserProfile?.following?.length || 0;
  const savedCount = currentUserProfile?.readingList?.length || 0;

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingCard} role="status" aria-live="polite">
          Loading Creator Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Streamlined Dashboard Header - No duplicate write button since it's always pinned above */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Creator Dashboard</h1>
          <p className={styles.subtitle}>
            In-depth analytics, audience reach, reader attention, and story performance.
          </p>
        </div>
        <div className={styles.pipelinePill}>
          <CheckCircle size={15} className={styles.pipelineIcon} aria-hidden="true" />
          <span>{analytics.pipelineCompletionRate}% Published Pipeline</span>
        </div>
      </header>

      {/* Primary KPI Grid: 8 Trackables */}
      <section className={styles.kpiGrid} aria-label="Creator analytics overview">
        {/* Total Views */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Total Views</p>
            <span className={`${styles.kpiIcon} ${styles.iconIndigo}`}>
              <Eye size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{analytics.totalViews.toLocaleString()}</p>
          <p className={styles.kpiSub}>Avg {analytics.avgViews} views / published story</p>
        </div>

        {/* Total Likes */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Total Likes</p>
            <span className={`${styles.kpiIcon} ${styles.iconRose}`}>
              <Heart size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{analytics.totalLikes.toLocaleString()}</p>
          <p className={styles.kpiSub}>{analytics.likeConversionRate}% reader like rate</p>
        </div>

        {/* Total Comments */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Total Comments</p>
            <span className={`${styles.kpiIcon} ${styles.iconAmber}`}>
              <MessageSquare size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{analytics.totalComments.toLocaleString()}</p>
          <p className={styles.kpiSub}>{analytics.commentConversionRate}% reader discussion rate</p>
        </div>

        {/* Engagement Rate */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Engagement Rate</p>
            <span className={`${styles.kpiIcon} ${styles.iconEmerald}`}>
              <TrendingUp size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{analytics.engagementRate}%</p>
          <p className={styles.kpiSub}>Likes &amp; comments per view</p>
        </div>

        {/* Words Written */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Words Written</p>
            <span className={`${styles.kpiIcon} ${styles.iconTeal}`}>
              <BookOpen size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{analytics.totalWords.toLocaleString()}</p>
          <p className={styles.kpiSub}>Avg {analytics.avgWordsPerStory} words / story</p>
        </div>

        {/* Total Reader Attention */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Reading Attention</p>
            <span className={`${styles.kpiIcon} ${styles.iconOrange}`}>
              <Clock size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{analytics.totalReadingMinutesGenerated.toLocaleString()}m</p>
          <p className={styles.kpiSub}>Est. total reader minutes delivered</p>
        </div>

        {/* Audience */}
        <Link to={`/profile/${currentUser?.uid}`} className={styles.kpiCard} title="View public profile">
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Audience</p>
            <span className={`${styles.kpiIcon} ${styles.iconSky}`}>
              <Users size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{followersCount.toLocaleString()}</p>
          <p className={styles.kpiSub}>
            Followers &middot; Following {followingCount} &middot; {savedCount} saved
          </p>
        </Link>

        {/* Publishing Cadence */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <p className={styles.kpiLabel}>Stories &amp; Cadence</p>
            <span className={`${styles.kpiIcon} ${styles.iconViolet}`}>
              <FileText size={17} aria-hidden="true" />
            </span>
          </div>
          <p className={styles.kpiValue}>{posts.length}</p>
          <p className={styles.kpiSub}>
            {analytics.publishedCount} published &middot; {analytics.recentPublishedCount} past 30 days
          </p>
        </div>
      </section>

      {/* Analytics Insights Grid: Leaderboard & Categories */}
      {analytics.publishedCount > 0 && (
        <section className={styles.insightsGrid} aria-label="Performance highlights">
          {/* Story Performance Leaderboard */}
          <div className={styles.insightCard}>
            <div className={styles.insightHeader}>
              <h2 className={styles.insightTitle}>
                <Award size={18} className={styles.accentIcon} aria-hidden="true" />
                <span>Story Performance Leaderboard</span>
              </h2>
              <span className={styles.badgeSubtle}>Top {analytics.leaderboard.length}</span>
            </div>

            <div className={styles.leaderboardList}>
              {analytics.leaderboard.map((item, index) => {
                const widthPct = Math.max(10, Math.round((item.views / analytics.maxLeaderboardViews) * 100));
                return (
                  <div key={item.id} className={styles.leaderboardRow}>
                    <div className={styles.leaderboardMeta}>
                      <div className={styles.rankBadge}>#{index + 1}</div>
                      <Link to={`/post/${item.id}`} className={styles.leaderboardTitle}>
                        {item.title}
                      </Link>
                      <div className={styles.leaderboardStats}>
                        <span title="Views">
                          <Eye size={13} aria-hidden="true" /> {item.views}
                        </span>
                        <span title="Likes">
                          <Heart size={13} aria-hidden="true" /> {item.likesCount}
                        </span>
                        <span title="Comments">
                          <MessageSquare size={13} aria-hidden="true" /> {item.commentsCount}
                        </span>
                        <span className={styles.leaderboardEng}>{item.engagementRate}% eng</span>
                      </div>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFillLeader} style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown & Reader Impact */}
          <div className={styles.insightCard}>
            <div className={styles.insightHeader}>
              <h2 className={styles.insightTitle}>
                <BarChart3 size={18} className={styles.accentIcon} aria-hidden="true" />
                <span>Category Performance</span>
              </h2>
              <span className={styles.badgeSubtle}>{analytics.categories.length} categories</span>
            </div>

            {analytics.categories.length > 0 ? (
              <div className={styles.categoryList}>
                {analytics.categories.map((cat) => {
                  const widthPct = Math.max(8, Math.round((cat.views / analytics.maxCatViews) * 100));
                  return (
                    <div key={cat.name} className={styles.categoryRow}>
                      <div className={styles.categoryMeta}>
                        <span className={styles.categoryName}>{cat.name}</span>
                        <span className={styles.categoryStats}>
                          {cat.posts} {cat.posts === 1 ? 'story' : 'stories'} &middot; {cat.views} views &middot; {cat.likes} likes
                        </span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyNote}>Publish stories with categories to see topic breakdowns.</p>
            )}

            {/* Reader Engagement Ratios Summary Box */}
            <div className={styles.ratioBox}>
              <div className={styles.ratioItem}>
                <span className={styles.ratioLabel}>Avg Story Length</span>
                <span className={styles.ratioVal}>{analytics.avgWordsPerStory} words ({analytics.avgReadTimeMinutes}m)</span>
              </div>
              <div className={styles.ratioItem}>
                <span className={styles.ratioLabel}>Like Conversion</span>
                <span className={styles.ratioVal}>{analytics.likeConversionRate}% of views</span>
              </div>
              <div className={styles.ratioItem}>
                <span className={styles.ratioLabel}>Discussion Rate</span>
                <span className={styles.ratioVal}>{analytics.commentConversionRate}% of views</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Management Table with Live Search and Rich Row Metadata */}
      <section className={styles.postsSection} aria-labelledby="dashboard-content-heading">
        <div className={styles.postsToolbar}>
          <div className={styles.toolbarLeft}>
            <h2 id="dashboard-content-heading" className={styles.postsTitle}>
              Your Content
            </h2>
            <div className={styles.filterGroup} role="tablist" aria-label="Filter stories by status">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
                className={`${styles.filterPill} ${statusFilter === 'all' ? styles.filterPillActive : ''}`}
              >
                All ({posts.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'published'}
                onClick={() => setStatusFilter('published')}
                className={`${styles.filterPill} ${statusFilter === 'published' ? styles.filterPillActive : ''}`}
              >
                Published ({analytics.publishedCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'draft'}
                onClick={() => setStatusFilter('draft')}
                className={`${styles.filterPill} ${statusFilter === 'draft' ? styles.filterPillActive : ''}`}
              >
                Drafts ({analytics.draftCount})
              </button>
            </div>
          </div>

          <div className={styles.toolbarRight}>
            {/* Real-time Search Box */}
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className={styles.searchInput}
                aria-label="Search stories by title or category"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
              aria-label="Sort stories"
            >
              <option value="newest">Sort: Newest</option>
              <option value="views">Sort: Most Viewed</option>
              <option value="likes">Sort: Most Liked</option>
              <option value="comments">Sort: Most Discussed</option>
            </select>
          </div>
        </div>

        {filteredAndSortedPosts.length > 0 ? (
          <div className={styles.postList}>
            {filteredAndSortedPosts.map((post) => {
              const isDraft = post.status === 'draft';
              const dateLabel = formatDate(post.publishedAt || post.createdAt);
              const category = post.categories?.[0];
              const stats = analytics.postStatsMap[post.id] || {
                words: 0,
                readMinutes: 1,
                views: 0,
                likes: 0,
                comments: 0,
              };

              return (
                <div key={post.id} className={styles.postRow}>
                  <div className={styles.postMain}>
                    <Link
                      to={isDraft ? `/edit-post/${post.id}` : `/post/${post.id}`}
                      className={styles.postTitleLink}
                    >
                      {post.title || 'Untitled Story'}
                    </Link>
                    <div className={styles.postMetaLine}>
                      <span
                        className={`${styles.postStatus} ${
                          isDraft ? styles.statusDraft : styles.statusPublished
                        }`}
                      >
                        {post.status}
                      </span>
                      {category && <span className={styles.postCategoryTag}>{category}</span>}
                      {stats.words > 0 && (
                        <span className={styles.wordStat}>
                          {stats.words} words &middot; {stats.readMinutes}m read
                        </span>
                      )}
                      {dateLabel && <span>{dateLabel}</span>}
                    </div>
                  </div>

                  <div className={styles.postRight}>
                    {!isDraft && (
                      <div className={styles.postStats}>
                        <span className={styles.statItem} title="Views">
                          <Eye size={15} aria-hidden="true" /> {post.viewCount || 0}
                        </span>
                        <span className={styles.statItem} title="Likes">
                          <Heart size={15} aria-hidden="true" /> {post.likes?.length || 0}
                        </span>
                        <span className={styles.statItem} title="Comments">
                          <MessageSquare size={15} aria-hidden="true" /> {commentCounts[post.id] || 0}
                        </span>
                      </div>
                    )}

                    <div className={styles.postActions}>
                      {isDraft ? (
                        <button
                          type="button"
                          onClick={() => handlePublish(post.id)}
                          className={styles.publishButton}
                          title="Publish Post"
                        >
                          <Send size={14} aria-hidden="true" />
                          <span>Publish</span>
                        </button>
                      ) : (
                        <Link
                          to={`/post/${post.id}`}
                          className={styles.iconActionButton}
                          title="View live post"
                          aria-label={`View ${post.title}`}
                        >
                          <ExternalLink size={15} aria-hidden="true" />
                        </Link>
                      )}
                      <Link
                        to={`/edit-post/${post.id}`}
                        className={styles.iconActionButton}
                        title="Edit post"
                        aria-label={`Edit ${post.title}`}
                      >
                        <Edit2 size={15} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className={`${styles.iconActionButton} ${styles.deleteButton}`}
                        title="Delete post"
                        aria-label={`Delete ${post.title}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Sparkles size={36} className={styles.emptyIcon} aria-hidden="true" />
            <h3 className={styles.emptyTitle}>
              {posts.length === 0
                ? 'No stories yet'
                : searchQuery
                ? 'No stories match your search'
                : 'No stories match this filter'}
            </h3>
            <p className={styles.emptyText}>
              {posts.length === 0
                ? 'Start writing your first story using the Write button in the navbar!'
                : 'Try adjusting your search query or filter options above.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
