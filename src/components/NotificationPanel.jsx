// src/components/NotificationPanel.jsx

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import Avatar from './Avatar';
import styles from './NotificationPanel.module.css';
import { Bell, Heart, MessageSquare, UserPlus } from 'lucide-react';

function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();
  const { profiles } = useUserProfiles();
  const navigate = useNavigate();
  const panelRef = useRef();

  useClickOutside(panelRef, () => setIsOpen(false));

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users', currentUser.uid, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAsRead = async () => {
    if (!currentUser) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(note => {
      const noteRef = doc(db, 'users', currentUser.uid, 'notifications', note.id);
      batch.update(noteRef, { read: true });
    });
    await batch.commit();
  };

  const handleTogglePanel = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    // If we are opening the panel, mark notifications as read
    if (newIsOpen) {
      handleMarkAsRead();
    }
  };

  const handleNotificationClick = (note) => {
    setIsOpen(false);
    if (note.type === 'follow' && note.fromUserId) {
      navigate(`/profile/${note.fromUserId}`);
    } else if (note.postId) {
      navigate(`/post/${note.postId}`);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
    } catch {
      return 'Just now';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button onClick={handleTogglePanel} className={styles.panelButton} aria-label="Notifications">
        <Bell size={24} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.panelContainer}>
          <header className={styles.header}>Notifications</header>
          <div className={styles.notificationList}>
            {notifications.length > 0 ? (
              notifications.map(note => {
                const actorName = (note.fromUserId && profiles[note.fromUserId]?.username) || note.fromUser || 'Someone';
                return (
                  <div key={note.id} onClick={() => handleNotificationClick(note)} className={styles.notificationItem}>
                    <div className={styles.avatarBadgeWrapper}>
                      <Avatar
                        userId={note.fromUserId}
                        name={actorName}
                        className={styles.notifAvatar}
                        size="xs"
                      />
                      <span className={styles.typeBadge}>
                        {note.type === 'like' && <Heart size={11} />}
                        {note.type === 'comment' && <MessageSquare size={11} />}
                        {note.type === 'follow' && <UserPlus size={11} />}
                      </span>
                    </div>
                    <div>
                      {note.type === 'follow' ? (
                        <p className={styles.text}><strong>{actorName}</strong> started following you.</p>
                      ) : (
                        <p className={styles.text}><strong>{actorName}</strong> {note.type === 'like' ? 'liked your post:' : 'commented on:'} <strong>&quot;{note.postTitle}&quot;</strong></p>
                      )}
                      <p className={styles.timestamp}>{formatTimestamp(note.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.emptyState}>You have no new notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
