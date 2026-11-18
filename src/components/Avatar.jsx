// src/components/Avatar.jsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'lucide-react';
import { useUserProfiles } from '../context/UserProfileContext';
import { isValidImageSrc } from '../utils/imageUtils';
import styles from './Avatar.module.css';

const generateColor = (str) => {
  if (!str || !str.trim()) return '#6366f1';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Keep generated avatar backgrounds vibrant and high-contrast against white text
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 58%, 44%)`;
};

function Avatar({ userId, src, name, className, size }) {
  const { profiles, ensureUserProfile } = useUserProfiles();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (userId) {
      ensureUserProfile(userId);
    }
  }, [userId, ensureUserProfile]);

  const cachedProfile = userId ? profiles[userId] : null;

  // When a live Firestore profile is available for userId, treat its profilePictureURL as authoritative.
  // While loading (or when userId is omitted for live edit previews), fall back to the passed src prop.
  const resolvedSrc = useMemo(() => {
    if (cachedProfile && !cachedProfile.missing) {
      return cachedProfile.profilePictureURL || '';
    }
    return src || '';
  }, [cachedProfile, src]);

  const resolvedName = useMemo(() => {
    if (cachedProfile && !cachedProfile.missing && cachedProfile.username) {
      return cachedProfile.username;
    }
    return name || '';
  }, [cachedProfile, name]);

  const trimmedSrc = typeof resolvedSrc === 'string' ? resolvedSrc.trim() : '';
  const hasValidSrc = isValidImageSrc(trimmedSrc);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);

    // Handle images that are already complete in browser cache
    const imgEl = imgRef.current;
    if (hasValidSrc && imgEl && imgEl.complete) {
      if (imgEl.naturalWidth > 0) {
        setImageLoaded(true);
      } else {
        setImageError(true);
      }
    }
  }, [trimmedSrc, hasValidSrc]);

  const trimmedName = typeof resolvedName === 'string' ? resolvedName.trim() : '';
  const initial = trimmedName ? trimmedName.charAt(0).toUpperCase() : '';
  const avatarColor = useMemo(() => generateColor(trimmedName || userId || ''), [trimmedName, userId]);

  const sizeClass = useMemo(() => {
    if (size === 'xs') return styles.xsInitial;
    if (size === 'md') return styles.mdInitial;
    if (size === 'lg' || (className && className.includes('profilePicture'))) {
      return styles.largeInitial;
    }
    return styles.smInitial;
  }, [size, className]);

  return (
    <div
      className={`${styles.avatarWrapper} ${className || ''}`}
      role="img"
      aria-label={trimmedName || 'User avatar'}
      title={trimmedName || 'User avatar'}
    >
      {/* Always render the colored placeholder underneath so the avatar is NEVER blank while loading or on error */}
      <div
        className={`${styles.initials} ${sizeClass}`}
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {initial ? (
          <span>{initial}</span>
        ) : (
          <User className={styles.fallbackIcon} />
        )}
      </div>

      {/* Render the image cleanly layered on top; empty alt prevents raw alt text from ever appearing */}
      {hasValidSrc && !imageError && (
        <img
          ref={imgRef}
          src={trimmedSrc}
          alt=""
          className={`${styles.avatarImage} ${imageLoaded ? styles.imageVisible : styles.imageLoading}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export default Avatar;
