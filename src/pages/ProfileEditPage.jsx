// src/pages/ProfileEditPage.jsx

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import Avatar from '../components/Avatar';
import { compressImageToDataURL, isValidImageSrc } from '../utils/imageUtils';
import styles from './ProfileEditPage.module.css';
import { Camera, Save } from 'lucide-react';

function ProfileEditPage() {
  const { currentUser } = useAuth();
  const { updateCachedProfile } = useUserProfiles();
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    dateOfBirth: '',
    location: '',
    profilePictureURL: '',
    coverPhotoURL: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const profileFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      const loadUserData = async () => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData({
              username: data.username || currentUser.displayName || '',
              bio: data.bio || '',
              dateOfBirth: data.dateOfBirth || '',
              location: data.location || '',
              profilePictureURL:
                data.profilePictureURL !== undefined
                  ? data.profilePictureURL
                  : currentUser.photoURL || '',
              coverPhotoURL: data.coverPhotoURL || ''
            });
          } else {
            setProfileData((prev) => ({
              ...prev,
              username: currentUser.displayName || '',
              profilePictureURL: currentUser.photoURL || ''
            }));
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        } finally {
          setLoading(false);
        }
      };
      loadUserData();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'coverPhotoURL') setCoverError(false);
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataURL(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.82
      });
      setProfileData(prev => ({ ...prev, profilePictureURL: dataUrl }));
      setStatusMessage({ type: 'info', text: 'Profile photo selected. Click "Save Changes" to apply it across the app.' });
    } catch (err) {
      console.error('Failed to process profile image:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not process the selected image.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverPhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataURL(file, {
        maxWidth: 1200,
        maxHeight: 400,
        quality: 0.8
      });
      setCoverError(false);
      setProfileData(prev => ({ ...prev, coverPhotoURL: dataUrl }));
      setStatusMessage({ type: 'info', text: 'Cover photo selected. Click "Save Changes" to apply.' });
    } catch (err) {
      console.error('Failed to process cover image:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not process the selected image.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveChanges = async () => {
    if (!currentUser) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, profileData, { merge: true });

      // Update central user profile cache immediately so Navbar, feed, comments, etc. reflect changes right away
      updateCachedProfile(currentUser.uid, profileData);

      // Update Firebase Auth profile safely (Auth rejects data: URLs or URLs exceeding ~2048 chars)
      try {
        const authUpdates = { displayName: profileData.username };
        const pic = profileData.profilePictureURL?.trim() || '';
        if (!pic.startsWith('data:') && pic.length <= 1024) {
          authUpdates.photoURL = pic;
        }
        await updateProfile(currentUser, authUpdates);
      } catch (authErr) {
        console.warn('Auth profile sync skipped (Firestore remains authoritative):', authErr);
      }

      setStatusMessage({ type: 'success', text: 'Profile updated successfully! Your profile photo is now live across the app.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatusMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading Profile...</div>;

  const hasValidCover = isValidImageSrc(profileData.coverPhotoURL) && !coverError;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Edit Your Profile</h1>
      </header>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className={styles.formContainer}>
        <div className={styles.coverPhoto}>
          {hasValidCover && (
            <img
              src={profileData.coverPhotoURL.trim()}
              alt=""
              onError={() => setCoverError(true)}
            />
          )}
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => coverFileInputRef.current?.click()}
            className={styles.photoButton}
          >
            <Camera size={16} /> Edit Cover
          </button>
        </div>

        <div className={styles.profilePictureContainer}>
          <div className={styles.profilePicture}>
            <Avatar
              src={profileData.profilePictureURL}
              name={profileData.username || currentUser?.email}
              className={styles.avatarFill}
              size="lg"
            />
            <input
              ref={profileFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => profileFileInputRef.current?.click()}
              className={styles.photoButton}
              title="Select profile picture"
              aria-label="Select profile picture"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>

        <div className={styles.formFields}>
          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Name</label>
            <input name="username" value={profileData.username} onChange={handleInputChange} className={styles.input} />
          </div>
          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Bio</label>
            <textarea name="bio" value={profileData.bio} onChange={handleInputChange} className={styles.textarea} rows="4"></textarea>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Date of Birth</label>
            <input name="dateOfBirth" type="date" value={profileData.dateOfBirth} onChange={handleInputChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Location</label>
            <input name="location" value={profileData.location} onChange={handleInputChange} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Profile Picture URL (or click camera icon to upload)</label>
            <input
              name="profilePictureURL"
              value={profileData.profilePictureURL.startsWith('data:') ? '' : profileData.profilePictureURL}
              onChange={handleInputChange}
              placeholder={profileData.profilePictureURL.startsWith('data:') ? 'Uploaded image selected (enter URL to replace)' : 'https://example.com/avatar.jpg'}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Cover Photo URL (or click Edit Cover to upload)</label>
            <input
              name="coverPhotoURL"
              value={profileData.coverPhotoURL.startsWith('data:') ? '' : profileData.coverPhotoURL}
              onChange={handleInputChange}
              placeholder={profileData.coverPhotoURL.startsWith('data:') ? 'Uploaded cover selected (enter URL to replace)' : 'https://example.com/cover.jpg'}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="button" onClick={handleSaveChanges} disabled={saving} className={styles.saveButton}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileEditPage;
