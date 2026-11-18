// src/components/Navbar.jsx

import { useState, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { useTheme } from '../context/ThemeContext';
import { useClickOutside } from '../hooks/useClickOutside';
import NotificationPanel from './NotificationPanel';
import Avatar from './Avatar';
import BurstLogo from './BurstLogo';
import styles from './Navbar.module.css';
import {
  Home,
  LayoutDashboard,
  Bookmark,
  PenSquare,
  Sun,
  Moon,
  User,
  Edit2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const { currentUserProfile } = useUserProfiles();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useClickOutside(userMenuRef, () => setIsUserMenuOpen(false));
  useClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false));

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const displayName =
    currentUserProfile?.username ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Writer';

  const userEmail = currentUser?.email || '';

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        {/* Left Section: Brand Logo & Desktop Primary Navigation */}
        <div className={styles.leftSection}>
          <Link
            to={currentUser ? '/home' : '/'}
            className={styles.logoLink}
            aria-label="Burst Home"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <BurstLogo size="md" />
          </Link>

          {currentUser && (
            <nav className={styles.desktopNav} aria-label="Main navigation">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <Home size={17} aria-hidden="true" />
                <span>Feed</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <LayoutDashboard size={17} aria-hidden="true" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/reading-list"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <Bookmark size={17} aria-hidden="true" />
                <span>Reading List</span>
              </NavLink>
            </nav>
          )}
        </div>

        {/* Right Section: Write CTA, Theme Toggle, Notifications & Account */}
        <div className={styles.rightSection}>
          {currentUser ? (
            <>
              {/* Write Story Button */}
              <Link to="/create-post" className={styles.writeButton} title="Write a new story">
                <PenSquare size={16} aria-hidden="true" />
                <span>Write</span>
              </Link>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className={styles.iconButton}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? (
                  <Sun size={18} className={styles.sunIcon} aria-hidden="true" />
                ) : (
                  <Moon size={18} className={styles.moonIcon} aria-hidden="true" />
                )}
              </button>

              {/* Notifications */}
              <NotificationPanel />

              {/* User Avatar Menu Trigger */}
              <div className={styles.userMenuContainer} ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className={styles.avatarTrigger}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="User account menu"
                >
                  <Avatar
                    userId={currentUser.uid}
                    src={currentUserProfile?.profilePictureURL || currentUser.photoURL}
                    name={displayName}
                    className={styles.navbarAvatar}
                    size="sm"
                  />
                  <ChevronDown
                    size={14}
                    className={`${styles.chevronIcon} ${
                      isUserMenuOpen ? styles.chevronOpen : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Account Dropdown */}
                {isUserMenuOpen && (
                  <div className={styles.userDropdown} role="menu">
                    <div className={styles.dropdownHeader}>
                      <p className={styles.userName}>{displayName}</p>
                      <p className={styles.userEmail}>{userEmail}</p>
                    </div>

                    <div className={styles.dropdownDivider} />

                    <Link
                      to={`/profile/${currentUser.uid}`}
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={16} aria-hidden="true" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      to="/edit-profile"
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Edit2 size={16} aria-hidden="true" />
                      <span>Edit Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={16} aria-hidden="true" />
                      <span>Settings</span>
                    </Link>

                    <div className={styles.dropdownDivider} />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                      role="menuitem"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className={styles.mobileHamburger}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </>
          ) : (
            <>
              {/* Theme toggle for guests */}
              <button
                type="button"
                onClick={toggleTheme}
                className={styles.iconButton}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <Link to="/login" className={styles.loginLink}>
                Log In
              </Link>
              <Link to="/signup" className={styles.writeButton}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Visible on smaller viewports) */}
      {currentUser && isMobileMenuOpen && (
        <div className={styles.mobileDrawer} ref={mobileMenuRef}>
          <div className={styles.mobileUserCard}>
            <Avatar
              userId={currentUser.uid}
              src={currentUserProfile?.profilePictureURL || currentUser.photoURL}
              name={displayName}
              size="md"
            />
            <div className={styles.mobileUserInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userEmail}>{userEmail}</p>
            </div>
          </div>

          <nav className={styles.mobileNavLinks} aria-label="Mobile navigation">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home size={18} aria-hidden="true" />
              <span>Feed</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/reading-list"
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Bookmark size={18} aria-hidden="true" />
              <span>Reading List</span>
            </NavLink>

            <NavLink
              to="/create-post"
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <PenSquare size={18} aria-hidden="true" />
              <span>Write Story</span>
            </NavLink>

            <div className={styles.dropdownDivider} />

            <Link
              to={`/profile/${currentUser.uid}`}
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={18} aria-hidden="true" />
              <span>View Profile</span>
            </Link>

            <Link
              to="/edit-profile"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Edit2 size={18} aria-hidden="true" />
              <span>Edit Profile</span>
            </Link>

            <Link
              to="/settings"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings size={18} aria-hidden="true" />
              <span>Settings</span>
            </Link>

            <div className={styles.dropdownDivider} />

            <button
              type="button"
              onClick={handleLogout}
              className={`${styles.mobileLink} ${styles.logoutItem}`}
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
