// src/pages/UserSettingsPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { db } from '../firebase/config';
import Avatar from '../components/Avatar';
import { compressImageToDataURL } from '../utils/imageUtils';
import { User, Settings, Bell, Shield, Paintbrush, Save, Camera, Moon, Sun } from 'lucide-react';

const UserSettingsPage = () => {
  const { currentUser } = useAuth();
  const { updateCachedProfile } = useUserProfiles();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const [profileData, setProfileData] = useState({ username: '', bio: '', location: '', website: '', profilePictureURL: '' });
  const [accountData, setAccountData] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ emailOnComment: true, emailOnLike: true, emailOnFollow: true, weeklyDigest: false });
  const [privacy, setPrivacy] = useState({ profileVisibility: 'public', showEmailOnProfile: false });

  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData({
          username: userData.username || currentUser.displayName || '',
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          profilePictureURL:
            userData.profilePictureURL !== undefined
              ? userData.profilePictureURL
              : currentUser.photoURL || ''
        });
        if (userData.notifications) {
          setNotifications(prev => ({ ...prev, ...userData.notifications }));
        }
        if (userData.privacy) {
          setPrivacy(prev => ({ ...prev, ...userData.privacy }));
        }
      }
      setAccountData(prev => ({ ...prev, email: currentUser.email || '' }));
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser, loadUserData]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataURL(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.82
      });
      setProfileData(prev => ({ ...prev, profilePictureURL: dataUrl }));
      setMessage({ type: 'success', text: 'Photo selected! Click "Save Changes" to apply it across the app.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not process image.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const updatedFields = {
        username: profileData.username,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        profilePictureURL: profileData.profilePictureURL
      };
      await setDoc(doc(db, 'users', currentUser.uid), updatedFields, { merge: true });
      updateCachedProfile(currentUser.uid, updatedFields);

      try {
        const authUpdates = { displayName: profileData.username };
        const pic = profileData.profilePictureURL?.trim() || '';
        if (!pic.startsWith('data:') && pic.length <= 1024) {
          authUpdates.photoURL = pic;
        }
        await updateProfile(currentUser, authUpdates);
      } catch (authErr) {
        console.warn('Auth profile sync skipped:', authErr);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3500);
  };

  const handlePasswordUpdate = async () => {
    if (accountData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (accountData.newPassword !== accountData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      await updatePassword(currentUser, accountData.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setAccountData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: 'Error updating password: ' + err.message });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { notifications });
      setMessage({ type: 'success', text: 'Notification preferences updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating notifications: ' + error.message });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3500);
  };

  const handlePrivacyUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { privacy });
      setMessage({ type: 'success', text: 'Privacy settings updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating privacy settings: ' + error.message });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3500);
  };

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg font-medium transition-all ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Profile Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update your public profile details</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Your username"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                    <textarea
                      rows="3"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Write a short bio about yourself..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={profileData.profilePictureURL}
                        name={profileData.username || currentUser?.email}
                        className="w-20 h-20 border-2 border-gray-200 dark:border-gray-600"
                        size="md"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Camera size={16} />
                          Upload Photo
                        </button>
                        {profileData.profilePictureURL && (
                          <button
                            type="button"
                            onClick={() => setProfileData(prev => ({ ...prev, profilePictureURL: '' }))}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Or paste an image URL</label>
                      <input
                        type="url"
                        value={profileData.profilePictureURL.startsWith('data:') ? '' : profileData.profilePictureURL}
                        onChange={(e) => setProfileData(prev => ({ ...prev, profilePictureURL: e.target.value }))}
                        placeholder={profileData.profilePictureURL.startsWith('data:') ? 'Uploaded photo active (paste URL to replace)' : 'https://example.com/avatar.jpg'}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Account & Security</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your account email and password</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={accountData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email address is managed by your authentication provider.</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                        <input
                          type="password"
                          value={accountData.newPassword}
                          onChange={(e) => setAccountData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password (min. 6 characters)"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={accountData.confirmPassword}
                          onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordUpdate}
                    disabled={loading || !accountData.newPassword || !accountData.confirmPassword}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    <Save size={16} />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Notification Preferences</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose how you want to be notified about activity</p>
                  </div>

                  <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="flex items-center justify-between pt-4 first:pt-0">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Comments</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when someone comments on your post</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailOnComment}
                          onChange={(e) => setNotifications(prev => ({ ...prev, emailOnComment: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Likes</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when someone likes your post</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailOnLike}
                          onChange={(e) => setNotifications(prev => ({ ...prev, emailOnLike: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Followers</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when a new user follows your profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailOnFollow}
                          onChange={(e) => setNotifications(prev => ({ ...prev, emailOnFollow: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Weekly Digest</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly roundup of trending articles</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.weeklyDigest}
                          onChange={(e) => setNotifications(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleNotificationUpdate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Privacy Settings</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Control your profile visibility and privacy</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Visibility</label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                      >
                        <option value="public">Public - Anyone can view your profile and published stories</option>
                        <option value="followers">Followers Only - Only your followers can view your stories</option>
                        <option value="private">Private - Only you can view your profile details</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Show Email on Profile</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow other users to see your email address on your public profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy.showEmailOnProfile}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, showEmailOnProfile: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handlePrivacyUpdate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Customize the application theme</p>
                  </div>
                  <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      {darkMode ? <Moon className="text-blue-600" size={24} /> : <Sun className="text-yellow-500" size={24} />}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;
