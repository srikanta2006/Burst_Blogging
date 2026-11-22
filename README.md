# Burst ✦

> A modern, reactive publishing platform crafted with **React 19**, **Firebase Firestore**, and **CSS Modules**.

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.0-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![CSS Modules](https://img.shields.io/badge/CSS_Modules-Native_Design_Tokens-264DE4?style=flat-square&logo=css3&logoColor=white)](https://github.com/css-modules/css-modules)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

[**🚀 Explore Live Demo →**](https://blogging-page-gamma.vercel.app/)

---

## 💡 Overview

**Burst** is a full-featured, fast, and distraction-free blogging application designed for writers and readers. Built from the ground up as a modern portfolio project, it demonstrates full-stack architecture with real-time database synchronization, custom rich-text writing tools, client-side media optimization, and responsive design systems.

---

## ⚡ Engineering Highlights

### ✍️ Native Burst Story Studio
- **Zero Third-Party Iframes**: Replaced bulky third-party editors (like TinyMCE) with a native, zero-latency rich-text editor (`BurstEditor`) deeply integrated into the app's DOM.
- **Client-Side Canvas Image Compression**: Custom HTML5 Canvas utility (`imageUtils.js`) resizes and optimizes user images into lightweight data URLs before saving, eliminating external asset storage dependencies and CORS failures.
- **In-App Media & Hyperlink Modals**: Custom dialogs for links and images with live thumbnail previews and captioning.
- **Live Reader Preview**: Dual-mode switcher allowing authors to toggle instantly between the interactive WYSIWYG canvas and the exact reader layout.
- **Real-Time Writing Analytics**: Live tracking of word count, character count, and estimated reading time.

### 🔄 Reactive Data Pipeline & Optimization
- **Real-Time Sync**: Firestore snapshot listeners (`onSnapshot`) deliver instant updates for feed stories, notifications, likes, and followers.
- **Profile Cache Layer (`UserProfileContext`)**: Centralized in-memory user profile cache preventing redundant Firestore queries when displaying author avatars and usernames across comments, feeds, and cards.
- **Client-Side Index Management**: Handled trending and categorized feeds in memory, bypassing Firestore compound query index constraints.

### 📐 Adaptive Responsive Architecture
- **Desktop Dual-Column Flow (`≥ 1024px`)**: The main feed stories occupy the primary reading column (`2.7fr`), while the **Trending Post** card is pinned to a sticky right column (`1.3fr`) with viewport-height safety scroll boundaries.
- **Mobile-First Priority (`< 1024px`)**: Flex ordering promotes the **Trending Post** card to the very top of the feed, followed immediately by recent stories.
- **Sticky Glassmorphism Navigation**: The `Global Feed` / `Following` tab switcher stays pinned under the fixed navbar with frosted-glass blur (`backdrop-filter`) and click-through margins (`pointer-events: none`).

### 🎨 Theme Engine & Design Tokens
- **Zero-Runtime CSS**: Built entirely with semantic CSS custom properties (`:root` and `[data-theme="dark"]`) across scoped CSS Modules.
- **System Preference Detection**: Automatically synchronizes with OS dark mode settings while persisting user manual overrides in `localStorage`.
- **Universal Avatar System**: Robust fallback initials with calculated contrasting hues that prevent raw image alt text or broken placeholders.

### 📊 Creator Analytics Dashboard
- Comprehensive metrics suite featuring **8 KPIs**: Total Views, Net Likes, Comment Interactions, Engagement Rate, Word Output, Estimated Reader Attention, Audience Count, and 30-Day Publishing Cadence.
- Filterable and sortable story performance leaderboard with live search.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, React Router v7, Vite 7 |
| **Styling & Design** | Pure CSS Modules, Semantic CSS Variables, Lucide React Icons |
| **Backend & Database** | Cloud Firestore (NoSQL, real-time listeners), Firebase Security Rules |
| **Authentication** | Firebase Auth (Google OAuth & Email/Password) |
| **Media Processing** | Client-side HTML5 Canvas Compression |
| **Code Quality** | ESLint 9 (flat config), PostCSS |

---

## 📱 Core Features

- **Personalized Feeds**: Switch between the Global community feed and stories from authors you follow.
- **Reading List**: Save stories to a personal bookmarks list for later reading.
- **Interactive Social Features**: Real-time likes, bookmarks, comment threads, and author following.
- **Actionable Notifications**: Live notifications with author profile hydration, unread filtering, and direct story navigation.
- **Author Profiles**: Two-column author pages showcasing bio, location, website, metrics (followers, following, stories), and published posts.
- **Topic Discovery**: Dynamic category filtering with quick tags (`Technology`, `Design`, `AI`, `Productivity`, etc.).

---

## 📂 Project Structure

```
my-blog-app/
├── public/                 # Favicons and static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Avatar.jsx            # Universal avatar with fallback initials
│   │   ├── BurstEditor.jsx       # Native Burst Story Studio WYSIWYG editor
│   │   ├── BurstLogo.jsx         # Kinetic multi-stop gradient brand logo
│   │   ├── CommentSection.jsx    # Real-time comment threads
│   │   ├── LikeButton.jsx        # Optimistic like action button
│   │   ├── Navbar.jsx            # Fixed header with account menu & drawer
│   │   └── NotificationPanel.jsx # Live notifications drawer
│   ├── context/            # React Context providers
│   │   ├── AuthContext.jsx       # Firebase authentication state
│   │   ├── ThemeContext.jsx      # Dark / Light theme provider
│   │   └── UserProfileContext.jsx# Deduplicated user profile cache
│   ├── pages/              # Application views & routing
│   │   ├── Dashboard.jsx         # Creator analytics dashboard
│   │   ├── HomePage.jsx          # Responsive feed & trending layout
│   │   ├── PostEditor.jsx        # Story creation & publishing studio
│   │   ├── ProfilePage.jsx       # Two-column public author profiles
│   │   ├── ReadingListPage.jsx   # Saved articles collection
│   │   └── SinglePostPage.jsx    # Article view with reading progress bar
│   ├── utils/              # Helper utilities
│   │   └── imageUtils.js         # Canvas compression & URL validation
│   ├── firebase/           # Firebase initialization & SDK config
│   ├── App.jsx             # Route definitions & guards
│   ├── index.css           # Global theme design tokens & typography
│   └── main.jsx            # React root mount
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed on your machine
- A Firebase project with **Authentication** and **Cloud Firestore** enabled

### 1. Clone & Install
```bash
git clone https://github.com/srikanta2006/Burst_Blogging.git
cd Burst_Blogging
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to explore the app locally.

### 4. Build for Production
```bash
npm run build
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
