// src/pages/ProfileEditPage.jsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import Avatar from '../components/Avatar';
import { compressImageToDataURL, isValidImageSrc } from '../utils/imageUtils';
import styles from './ProfileEditPage.module.css';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Globe,
  Calendar,
} from 'lucide-react';

const LIMITS = {
  username: 50,
  headline: 80,
  bio: 300,
  location: 60,
};

const EMPTY_PROFILE = {
  username: '',
  headline: '',
  bio: '',
  dateOfBirth: '',
  location: '',
  website: '',
  profilePictureURL: '',
  coverPhotoURL: '',
};

function validateWebsite(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.includes('.')) {
      return 'Please enter a valid website URL (e.g., https://example.com).';
    }
    return null;
  } catch {
    return 'Please enter a valid website URL (e.g., https://example.com).';
  }
}

function ProfileEditPage() {
  const { currentUser } = useAuth();
  const { updateCachedProfile } = useUserProfiles();
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [initialData, setInitialData] = useState(EMPTY_PROFILE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const profileFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    const loadUserData = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (cancelled) return;

        let loaded;
        if (docSnap.exists()) {
          const data = docSnap.data();
          loaded = {
            username: data.username || currentUser.displayName || '',
            headline: data.headline || '',
            bio: data.bio || '',
            dateOfBirth: data.dateOfBirth || '',
            location: data.location || '',
            website: data.website || '',
            profilePictureURL:
              data.profilePictureURL !== undefined
                ? data.profilePictureURL
                : currentUser.photoURL || '',
            coverPhotoURL: data.coverPhotoURL || '',
          };
        } else {
          loaded = {
            ...EMPTY_PROFILE,
            username: currentUser.displayName || '',
            profilePictureURL: currentUser.photoURL || '',
          };
        }
        setProfileData(loaded);
        setInitialData(loaded);
      } catch (err) {
        console.error('Error loading user profile:', err);
        if (!cancelled) {
          setStatusMessage({
            type: 'error',
            text: 'Unable to load your profile data. Please refresh the page.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const isDirty = useMemo(
    () => JSON.stringify(profileData) !== JSON.stringify(initialData),
    [profileData, initialData]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'coverPhotoURL') setCoverError(false);
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleProfilePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataURL(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.82,
      });
      setProfileData((prev) => ({ ...prev, profilePictureURL: dataUrl }));
      setFieldErrors((prev) => ({ ...prev, profilePictureURL: null }));
      setStatusMessage({
        type: 'info',
        text: 'Profile photo selected. Click "Save Changes" to publish it across the app.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not process the selected image.',
      });
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
        quality: 0.8,
      });
      setCoverError(false);
      setProfileData((prev) => ({ ...prev, coverPhotoURL: dataUrl }));
      setFieldErrors((prev) => ({ ...prev, coverPhotoURL: null }));
      setStatusMessage({
        type: 'info',
        text: 'Cover image selected. Click "Save Changes" to apply.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not process the selected image.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedName = profileData.username.trim();
    if (!trimmedName) {
      errors.username = 'Display name is required.';
    } else if (trimmedName.length < 2) {
      errors.username = 'Display name must be at least 2 characters.';
    }

    const websiteErr = validateWebsite(profileData.website);
    if (websiteErr) {
      errors.website = websiteErr;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setProfileData(initialData);
    setFieldErrors({});
    setCoverError(false);
    setStatusMessage(null);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!currentUser || saving) return;

    if (!validateForm()) {
      setStatusMessage({
        type: 'error',
        text: 'Please fix the highlighted fields before saving.',
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const sanitizedData = {
      username: profileData.username.trim(),
      headline: profileData.headline.trim(),
      bio: profileData.bio.trim(),
      dateOfBirth: profileData.dateOfBirth,
      location: profileData.location.trim(),
      website: profileData.website.trim(),
      profilePictureURL: profileData.profilePictureURL.trim(),
      coverPhotoURL: profileData.coverPhotoURL.trim(),
    };

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, sanitizedData, { merge: true });

      // Propagate immediately to Navbar, Feed, Comments, Reading List, and Profile
      updateCachedProfile(currentUser.uid, sanitizedData);

      try {
        const authUpdates = { displayName: sanitizedData.username };
        const pic = sanitizedData.profilePictureURL;
        if (!pic.startsWith('data:') && pic.length <= 1024) {
          authUpdates.photoURL = pic;
        }
        await updateProfile(currentUser, authUpdates);
      } catch (authErr) {
        console.warn('Auth profile sync skipped (Firestore remains authoritative):', authErr);
      }

      setProfileData(sanitizedData);
      setInitialData(sanitizedData);
      setStatusMessage({
        type: 'success',
        text: 'Public profile saved! Your updates are now live across the platform.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to save profile changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingCard} role="status" aria-live="polite">
          Loading your profile editor...
        </div>
      </div>
    );
  }

  const hasValidCover = isValidImageSrc(profileData.coverPhotoURL) && !coverError;
  const hasProfilePhoto = isValidImageSrc(profileData.profilePictureURL);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.topBar}>
        <Link to={`/profile/${currentUser?.uid}`} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Public Profile</span>
        </Link>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Edit Public Profile</h1>
            <p className={styles.subtitle}>
              Customize how readers see you across posts, comments, and your author page.
            </p>
          </div>
          {isDirty && (
            <span className={styles.dirtyBadge} role="status" aria-live="polite">
              Unsaved changes
            </span>
          )}
        </div>
      </header>

      {statusMessage && (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`${styles.alert} ${
            statusMessage.type === 'error'
              ? styles.alertError
              : statusMessage.type === 'success'
              ? styles.alertSuccess
              : styles.alertInfo
          }`}
        >
          <div className={styles.alertContent}>
            {statusMessage.type === 'error' ? (
              <AlertCircle size={18} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} aria-hidden="true" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className={styles.dismissButton}
            aria-label="Dismiss notification"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <form onSubmit={handleSaveChanges} noValidate className={styles.formCard}>
        {/* Cover Photo Studio */}
        <div className={styles.coverSection}>
          {hasValidCover && (
            <img
              src={profileData.coverPhotoURL.trim()}
              alt=""
              className={styles.coverImage}
              onError={() => setCoverError(true)}
            />
          )}
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoFileChange}
            className={styles.hiddenInput}
            aria-label="Upload cover image file"
          />
          <div className={styles.coverControls}>
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              className={styles.mediaOverlayButton}
            >
              <Camera size={13} aria-hidden="true" />
              <span>{hasValidCover ? 'Change Cover' : 'Upload Cover'}</span>
            </button>
            {profileData.coverPhotoURL && (
              <button
                type="button"
                onClick={() => {
                  setProfileData((prev) => ({ ...prev, coverPhotoURL: '' }));
                  setCoverError(false);
                }}
                className={`${styles.mediaOverlayButton} ${styles.mediaDangerButton}`}
                aria-label="Remove cover photo"
              >
                <Trash2 size={13} aria-hidden="true" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Picture Studio */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarFrame}>
            <Avatar
              src={profileData.profilePictureURL}
              name={profileData.username || currentUser?.email}
              className={styles.avatarFill}
              size="lg"
            />
          </div>
          <div className={styles.avatarActions}>
            <input
              ref={profileFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoFileChange}
              className={styles.hiddenInput}
              aria-label="Upload profile picture file"
            />
            <div className={styles.avatarButtonRow}>
              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                className={styles.uploadButton}
              >
                <Camera size={13} aria-hidden="true" />
                <span>{hasProfilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {profileData.profilePictureURL && (
                <button
                  type="button"
                  onClick={() => setProfileData((prev) => ({ ...prev, profilePictureURL: '' }))}
                  className={styles.removeButton}
                >
                  <Trash2 size={13} aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>
            <p className={styles.avatarHint}>
              Square JPG, PNG, or WebP recommended. Automatically optimized for fast loading.
            </p>
          </div>
        </div>

        {/* Form Sections */}
        <div className={styles.formBody}>
          {/* Basic Identity */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Basic Information</legend>
            <p className={styles.fieldsetDescription}>
              Your display name, headline, and bio appear on your public author profile and posts.
            </p>

            <div className={styles.fieldGrid}>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <div className={styles.labelRow}>
                  <label htmlFor="profile-username" className={styles.label}>
                    Display Name
                    <span className={styles.requiredMark} aria-hidden="true">*</span>
                  </label>
                  <span
                    className={`${styles.charCount} ${
                      profileData.username.length >= LIMITS.username - 5 ? styles.charCountWarning : ''
                    }`}
                  >
                    {profileData.username.length}/{LIMITS.username}
                  </span>
                </div>
                <input
                  id="profile-username"
                  name="username"
                  type="text"
                  required
                  maxLength={LIMITS.username}
                  value={profileData.username}
                  onChange={handleInputChange}
                  placeholder="How should readers know you?"
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={fieldErrors.username ? 'profile-username-error' : undefined}
                  className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''}`}
                />
                {fieldErrors.username && (
                  <p id="profile-username-error" className={styles.fieldError} role="alert">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <div className={styles.labelRow}>
                  <label htmlFor="profile-headline" className={styles.label}>
                    Headline
                  </label>
                  <span className={styles.charCount}>
                    {profileData.headline.length}/{LIMITS.headline}
                  </span>
                </div>
                <input
                  id="profile-headline"
                  name="headline"
                  type="text"
                  maxLength={LIMITS.headline}
                  value={profileData.headline}
                  onChange={handleInputChange}
                  placeholder="e.g., Full-Stack Engineer & Technical Writer"
                  className={styles.input}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <div className={styles.labelRow}>
                  <label htmlFor="profile-bio" className={styles.label}>
                    Bio
                  </label>
                  <span
                    className={`${styles.charCount} ${
                      profileData.bio.length >= LIMITS.bio - 25 ? styles.charCountWarning : ''
                    }`}
                  >
                    {profileData.bio.length}/{LIMITS.bio}
                  </span>
                </div>
                <textarea
                  id="profile-bio"
                  name="bio"
                  rows="4"
                  maxLength={LIMITS.bio}
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell readers about your background, interests, and what you write about..."
                  className={styles.textarea}
                />
              </div>
            </div>
          </fieldset>

          {/* Details & Links */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Details &amp; Links</legend>
            <p className={styles.fieldsetDescription}>
              Add optional location and personal website links to help readers connect with you.
            </p>

            <div className={styles.fieldGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="profile-location" className={styles.label}>
                  <MapPin size={14} aria-hidden="true" />
                  <span>Location</span>
                </label>
                <input
                  id="profile-location"
                  name="location"
                  type="text"
                  maxLength={LIMITS.location}
                  value={profileData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="profile-website" className={styles.label}>
                  <Globe size={14} aria-hidden="true" />
                  <span>Website</span>
                </label>
                <input
                  id="profile-website"
                  name="website"
                  type="url"
                  value={profileData.website}
                  onChange={handleInputChange}
                  placeholder="https://yoursite.com"
                  aria-invalid={Boolean(fieldErrors.website)}
                  aria-describedby={fieldErrors.website ? 'profile-website-error' : undefined}
                  className={`${styles.input} ${fieldErrors.website ? styles.inputError : ''}`}
                />
                {fieldErrors.website && (
                  <p id="profile-website-error" className={styles.fieldError} role="alert">
                    {fieldErrors.website}
                  </p>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="profile-dob" className={styles.label}>
                  <Calendar size={14} aria-hidden="true" />
                  <span>Date of Birth</span>
                </label>
                <input
                  id="profile-dob"
                  name="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={handleInputChange}
                  aria-describedby="profile-dob-hint"
                  className={styles.input}
                />
                <p id="profile-dob-hint" className={styles.helperText}>
                  Kept private and not shown on your public profile.
                </p>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Action Footer */}
        <div className={styles.formFooter}>
          <div className={styles.footerSecondary}>
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || saving}
              className={styles.resetButton}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Discard Changes</span>
            </button>
          </div>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className={styles.saveButton}
          >
            <Save size={16} aria-hidden="true" />
            <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileEditPage;
