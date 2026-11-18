// src/pages/UserSettingsPage.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { useTheme } from '../context/ThemeContext';
import { doc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db } from '../firebase/config';
import Avatar from '../components/Avatar';
import { Lock, Bell, Save, ExternalLink, Sun, Moon, Palette, Check } from 'lucide-react';
import styles from './UserSettingsPage.module.css';

const DEFAULT_NOTIFICATIONS = {
  emailOnComment: true,
  emailOnLike: true,
  emailOnFollow: true,
};

function UserSettingsPage() {
  const { currentUser } = useAuth();
  const { currentUserProfile, updateCachedProfile } = useUserProfiles();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    if (currentUserProfile?.notifications) {
      setNotifications({
        emailOnComment: currentUserProfile.notifications.emailOnComment ?? true,
        emailOnLike: currentUserProfile.notifications.emailOnLike ?? true,
        emailOnFollow: currentUserProfile.notifications.emailOnFollow ?? true,
      });
    }
  }, [currentUserProfile?.notifications]);

  const showStatus = (type, text) => {
    setMessage({ type, text });
  };

  const hasPasswordProvider = Boolean(
    currentUser?.providerData?.some((p) => p.providerId === 'password')
  );

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (passwords.newPassword.length < 6) {
      showStatus('error', 'Password must be at least 6 characters long.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showStatus('error', 'New passwords do not match.');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await updatePassword(currentUser, passwords.newPassword);
      setPasswords({ newPassword: '', confirmPassword: '' });
      showStatus('success', 'Password updated successfully.');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        showStatus('error', 'For security, please log out and log back in before changing your password.');
      } else {
        showStatus('error', err.message || 'Unable to update password.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { notifications },
        { merge: true }
      );
      updateCachedProfile(currentUser.uid, { notifications });
      showStatus('success', 'Notification preferences saved.');
    } catch (err) {
      console.error('Error updating notifications:', err);
      showStatus('error', 'Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    currentUserProfile?.username || currentUser?.displayName || currentUser?.email || 'Account';

  const tabs = [
    { id: 'account', label: 'Account & Security', icon: Lock },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account security, appearance, and notification preferences.</p>
      </header>

      {message && (
        <div
          className={`${styles.alert} ${
            message.type === 'error' ? styles.alertError : styles.alertSuccess
          }`}
          role="status"
        >
          {message.text}
        </div>
      )}

      <div className={styles.layout}>
        <aside>
          <nav className={styles.sidebarNav} aria-label="Settings sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage(null);
                  }}
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className={styles.contentCard}>
          {/* Tab 1: Account & Security */}
          {activeTab === 'account' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Account &amp; Security</h2>
                <p className={styles.sectionDescription}>
                  Review your connected account and update your sign-in credentials.
                </p>
              </div>

              <div className={styles.profileBanner}>
                <div className={styles.profileBannerInfo}>
                  <Avatar
                    userId={currentUser?.uid}
                    src={currentUser?.photoURL}
                    name={displayName}
                    className={styles.profileAvatar}
                  />
                  <div>
                    <p className={styles.profileName}>{displayName}</p>
                    <p className={styles.profileEmail}>{currentUser?.email}</p>
                  </div>
                </div>
                <Link to="/edit-profile" className={styles.secondaryLink}>
                  <span>Edit Public Profile</span>
                  <ExternalLink size={15} />
                </Link>
              </div>

              <div className={styles.formSection}>
                <div className={styles.inputGroup}>
                  <label htmlFor="settings-email" className={styles.label}>
                    Email Address
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className={`${styles.input} ${styles.inputDisabled}`}
                  />
                  <p className={styles.helperText}>
                    Your email is managed by your authentication provider.
                  </p>
                </div>
              </div>

              <hr className={styles.divider} />

              <h3 className={styles.subHeading}>Change Password</h3>

              {hasPasswordProvider ? (
                <form onSubmit={handlePasswordUpdate} className={styles.formSection}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="new-password" className={styles.label}>
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="Enter new password (min. 6 characters)"
                      className={styles.input}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="confirm-password" className={styles.label}>
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Re-enter new password"
                      className={styles.input}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className={styles.actionsRow}>
                    <button
                      type="submit"
                      disabled={saving || !passwords.newPassword || !passwords.confirmPassword}
                      className={styles.primaryButton}
                    >
                      <Save size={16} />
                      <span>{saving ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.providerNotice}>
                  You are signed in with Google. Password and security settings are managed directly through your Google account.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Appearance & Theme */}
          {activeTab === 'appearance' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Appearance &amp; Theme</h2>
                <p className={styles.sectionDescription}>
                  Customize how Burst looks for you across all pages. You can also toggle between light and dark modes anytime from the top navigation bar.
                </p>
              </div>

              <div className={styles.themeGrid}>
                {/* Light Mode Option */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`${styles.themeOptionCard} ${
                    theme === 'light' ? styles.themeOptionActive : ''
                  }`}
                >
                  <div className={styles.themePreviewLight}>
                    <div className={styles.previewNavbarLight} />
                    <div className={styles.previewContentLight}>
                      <div className={styles.previewBar} />
                      <div className={styles.previewBarSub} />
                    </div>
                  </div>
                  <div className={styles.themeMeta}>
                    <div className={styles.themeTitleRow}>
                      <Sun size={17} className={styles.themeIconLight} />
                      <span className={styles.themeTitle}>Light Theme</span>
                      {theme === 'light' && <Check size={16} className={styles.activeCheck} />}
                    </div>
                    <p className={styles.themeDesc}>Crisp white surfaces with clean contrast for bright environments.</p>
                  </div>
                </button>

                {/* Dark Mode Option */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`${styles.themeOptionCard} ${
                    theme === 'dark' ? styles.themeOptionActive : ''
                  }`}
                >
                  <div className={styles.themePreviewDark}>
                    <div className={styles.previewNavbarDark} />
                    <div className={styles.previewContentDark}>
                      <div className={styles.previewBarDark} />
                      <div className={styles.previewBarSubDark} />
                    </div>
                  </div>
                  <div className={styles.themeMeta}>
                    <div className={styles.themeTitleRow}>
                      <Moon size={17} className={styles.themeIconDark} />
                      <span className={styles.themeTitle}>Dark Theme</span>
                      {theme === 'dark' && <Check size={16} className={styles.activeCheck} />}
                    </div>
                    <p className={styles.themeDesc}>Deep obsidian and indigo surfaces easy on the eyes in low light.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Notification Preferences</h2>
                <p className={styles.sectionDescription}>
                  Choose which activity updates you want to receive.
                </p>
              </div>

              <div className={styles.toggleList}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleText}>
                    <h4 className={styles.toggleTitle}>Comments</h4>
                    <p className={styles.toggleDescription}>
                      Notify me when someone comments on one of my posts.
                    </p>
                  </div>
                  <label className={styles.switch} aria-label="Toggle comment notifications">
                    <input
                      type="checkbox"
                      checked={notifications.emailOnComment}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, emailOnComment: e.target.checked }))
                      }
                      className={styles.switchInput}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleText}>
                    <h4 className={styles.toggleTitle}>Likes</h4>
                    <p className={styles.toggleDescription}>
                      Notify me when someone likes one of my posts.
                    </p>
                  </div>
                  <label className={styles.switch} aria-label="Toggle like notifications">
                    <input
                      type="checkbox"
                      checked={notifications.emailOnLike}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, emailOnLike: e.target.checked }))
                      }
                      className={styles.switchInput}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleText}>
                    <h4 className={styles.toggleTitle}>New Followers</h4>
                    <p className={styles.toggleDescription}>
                      Notify me when another user starts following my profile.
                    </p>
                  </div>
                  <label className={styles.switch} aria-label="Toggle follower notifications">
                    <input
                      type="checkbox"
                      checked={notifications.emailOnFollow}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, emailOnFollow: e.target.checked }))
                      }
                      className={styles.switchInput}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={handleNotificationUpdate}
                  disabled={saving}
                  className={styles.primaryButton}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default UserSettingsPage;
