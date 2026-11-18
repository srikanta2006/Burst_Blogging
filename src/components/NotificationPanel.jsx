// src/components/NotificationPanel.jsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { db } from '../firebase/config';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import Avatar from './Avatar';
import styles from './NotificationPanel.module.css';
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  CheckCheck,
  Trash2,
  Sparkles,
} from 'lucide-react';

function formatTimeAgo(ts) {
  if (!ts) return 'Just now';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();
  const { profiles, ensureUserProfiles } = useUserProfiles();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useClickOutside(panelRef, () => setIsOpen(false));

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notifCol = collection(db, 'users', currentUser.uid, 'notifications');
    const unsubscribe = onSnapshot(
      notifCol,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        fetched.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
          const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
          return timeB - timeA;
        });
        setNotifications(fetched);
      },
      (error) => {
        console.error('Error loading notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Pre-fetch live actor profiles for all notifications
  const actorIds = useMemo(() => {
    return [...new Set(notifications.map((n) => n.fromUserId).filter(Boolean))];
  }, [notifications]);

  useEffect(() => {
    if (actorIds.length > 0) {
      ensureUserProfiles(actorIds);
    }
  }, [actorIds, ensureUserProfiles]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );
  const unreadCount = unreadNotifications.length;

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return unreadNotifications;
    }
    return notifications;
  }, [filter, notifications, unreadNotifications]);

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation();
    if (!currentUser || unreadCount === 0) return;

    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach((note) => {
        const noteRef = doc(db, 'users', currentUser.uid, 'notifications', note.id);
        batch.update(noteRef, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (note) => {
    setIsOpen(false);

    // Optimistically and authoritatively mark as read
    if (!note.read && currentUser) {
      try {
        const noteRef = doc(db, 'users', currentUser.uid, 'notifications', note.id);
        await updateDoc(noteRef, { read: true });
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    }

    // Direct navigation to target
    if (note.type === 'follow' && note.fromUserId) {
      navigate(`/profile/${note.fromUserId}`);
    } else if (note.postId) {
      navigate(`/post/${note.postId}`);
    }
  };

  const handleDeleteNotification = async (e, noteId) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', noteId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearRead = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    const readNotes = notifications.filter((n) => n.read);
    if (readNotes.length === 0) return;

    try {
      const batch = writeBatch(db);
      readNotes.forEach((n) => {
        const ref = doc(db, 'users', currentUser.uid, 'notifications', n.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  return (
    <div ref={panelRef} className={styles.containerWrapper}>
      {/* Navbar Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${styles.panelButton} ${unreadCount > 0 ? styles.hasUnread : ''}`}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        title="Notifications"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout */}
      {isOpen && (
        <div className={styles.panelContainer} role="region" aria-label="Notifications panel">
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleRow}>
              <h3 className={styles.headerTitle}>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className={styles.markAllButton}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                onClick={() => setFilter('all')}
                className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'unread'}
                onClick={() => setFilter('unread')}
                className={`${styles.filterTab} ${filter === 'unread' ? styles.filterTabActive : ''}`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List */}
          <div className={styles.notificationList}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((note) => {
                const actor = note.fromUserId ? profiles[note.fromUserId] : null;
                const actorName = actor?.username || note.fromUser || 'Someone';
                const isUnread = !note.read;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleNotificationClick(note)}
                    className={`${styles.notificationItem} ${
                      isUnread ? styles.notificationUnread : ''
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(note);
                      }
                    }}
                  >
                    {/* Unread dot */}
                    {isUnread && <span className={styles.unreadDot} aria-label="Unread notification" />}

                    {/* Actor Avatar with action type badge */}
                    <div className={styles.avatarBadgeWrapper}>
                      <Avatar
                        userId={note.fromUserId}
                        src={actor?.profilePictureURL}
                        name={actorName}
                        className={styles.notifAvatar}
                        size="xs"
                      />
                      <span
                        className={`${styles.typeBadge} ${
                          note.type === 'like'
                            ? styles.typeLike
                            : note.type === 'comment'
                            ? styles.typeComment
                            : styles.typeFollow
                        }`}
                        aria-hidden="true"
                      >
                        {note.type === 'like' && <Heart size={10} fill="currentColor" />}
                        {note.type === 'comment' && <MessageSquare size={10} fill="currentColor" />}
                        {note.type === 'follow' && <UserPlus size={10} />}
                      </span>
                    </div>

                    {/* Notification Copy */}
                    <div className={styles.notifBody}>
                      {note.type === 'follow' ? (
                        <p className={styles.text}>
                          <strong className={styles.actorName}>{actorName}</strong> started following your profile.
                        </p>
                      ) : note.type === 'like' ? (
                        <p className={styles.text}>
                          <strong className={styles.actorName}>{actorName}</strong> liked your story{' '}
                          <span className={styles.postTitleQuote}>&ldquo;{note.postTitle}&rdquo;</span>
                        </p>
                      ) : (
                        <p className={styles.text}>
                          <strong className={styles.actorName}>{actorName}</strong> commented on{' '}
                          <span className={styles.postTitleQuote}>&ldquo;{note.postTitle}&rdquo;</span>
                        </p>
                      )}
                      <p className={styles.timestamp}>{formatTimeAgo(note.createdAt)}</p>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, note.id)}
                      className={styles.deleteButton}
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <Sparkles size={28} className={styles.emptyIcon} aria-hidden="true" />
                <p className={styles.emptyTitle}>
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className={styles.emptyDesc}>
                  {filter === 'unread'
                    ? 'You are all caught up on likes, comments, and followers!'
                    : 'When readers interact with your stories or follow you, updates will appear here.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.some((n) => n.read) && (
            <div className={styles.footer}>
              <button
                type="button"
                onClick={handleClearRead}
                className={styles.clearReadButton}
              >
                Clear read notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
