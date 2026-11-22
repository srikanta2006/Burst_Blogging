# Burst ✦ — Complete Technical Architecture & Interview Preparation Master Guide

> **Project Name:** Burst (Blogging Platform)  
> **Tech Stack:** React 19, Vite 7, React Router 7, Firebase 12 (Auth & Firestore), Pure CSS Modules  
> **Live Deployment:** [https://blogging-page-gamma.vercel.app/](https://blogging-page-gamma.vercel.app/)  
> **Repository:** [https://github.com/srikanta2006/Burst_Blogging](https://github.com/srikanta2006/Burst_Blogging)  
> **Target Audience:** Engineering Interviewers, Technical Hiring Managers, System Design Evaluators  

---

## 📑 Table of Contents

1. [High-Level Executive Architecture](#1-high-level-executive-architecture)
2. [State Management, Context & Caching Layer](#2-state-management-context--caching-layer)
3. [The Native Burst Story Studio (Custom Editor Engine)](#3-the-native-burst-story-studio-custom-editor-engine)
4. [Firestore Schema, Queries & Index Optimization](#4-firestore-schema-queries--index-optimization)
5. [Layout Engine, Responsive Ordering & Sticky CSS Architecture](#5-layout-engine-responsive-ordering--sticky-css-architecture)
6. [Universal Avatar & Resilient Media Processing](#6-universal-avatar--resilient-media-processing)
7. [Creator Analytics & Dashboard Computation Engine](#7-creator-analytics--dashboard-computation-engine)
8. [Social Graph, Activity Feeds & Real-Time Notifications](#8-social-graph-activity-feeds--real-time-notifications)
9. [Zero-Runtime Theme Engine & Typography](#9-zero-runtime-theme-engine--typography)
10. [Performance, Security & Scalability Blueprint](#10-performance-security--scalability-blueprint)
11. [Master Technical Interview Question & Answer Bank](#11-master-technical-interview-question--answer-bank)
    - [Category 1: High-Level Architecture & Project Overview](#category-1-high-level-architecture--project-overview)
    - [Category 2: React 19, Context API & State Management](#category-2-react-19-context-api--state-management)
    - [Category 3: Cloud Firestore, Real-Time Streams & Index Tuning](#category-3-cloud-firestore-real-time-streams--index-tuning)
    - [Category 4: Native Burst Editor & Canvas Image Compression](#category-4-native-burst-editor--canvas-image-compression)
    - [Category 5: CSS Modules, Responsive Grid/Flex & Sticky Positioning](#category-5-css-modules-responsive-gridflex--sticky-positioning)
    - [Category 6: Performance, Web Vitals & Security (XSS / Rules)](#category-6-performance-web-vitals--security-xss--rules)
    - [Category 7: Scenario-Based Debugging & Edge Cases](#category-7-scenario-based-debugging--edge-cases)
12. [Master Behavioral, Project Management & Non-Technical Interview Bank](#12-master-behavioral-project-management--non-technical-interview-bank)
    - [Category 8: Personal Narrative, Motivation & Engineering Philosophy](#category-8-personal-narrative-motivation--engineering-philosophy)
    - [Category 9: Decision Making, Trade-offs & Scope Prioritization](#category-9-decision-making-trade-offs--scope-prioritization)
    - [Category 10: Failures, Mistakes & Handling Feedback (STAR Stories)](#category-10-failures-mistakes--handling-feedback-star-stories)
    - [Category 11: Teamwork, Product Strategy & Future Roadmap](#category-11-teamwork-product-strategy--future-roadmap)

---

## 1. High-Level Executive Architecture

### 1.1 Architectural Pattern
Burst is architected as a modern **Backend-as-a-Service (BaaS) Single-Page Application (SPA)**. It couples a reactive **React 19** frontend with **Firebase 12** managed cloud services:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER (SPA)                          │
│                                                                         │
│   React 19 Root (main.jsx)                                              │
│   ├── ThemeProvider (ThemeContext.jsx) ─── [OS Preference / LocalStore] │
│   ├── AuthProvider (AuthContext.jsx) ───── [Firebase Auth Session]      │
│   └── UserProfileProvider (UserProfileContext.jsx) ── [LRU Cache]       │
│       │                                                                 │
│       ├── Public Routes (/login, /signup, /)                            │
│       └── Protected Layout (MainLayout.jsx)                             │
│           ├── Sticky Header (Navbar.jsx + NotificationPanel.jsx)        │
│           └── React Router v7 Outlet                                    │
│               ├── HomePage (/home) ── Dual-Column Adaptive Feed         │
│               ├── SinglePostPage (/post/:id) ── Reading Progress Bar   │
│               ├── PostEditor (/create-post, /edit-post/:id) ── Studio  │
│               ├── Dashboard (/dashboard) ── 8 KPI Analytics             │
│               ├── ProfilePage (/profile/:id) ── Sticky Author Card     │
│               ├── ReadingListPage (/reading-list)                       │
│               └── CategoryPage (/category/:name)                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WebSocket Listeners
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLOUD BACKEND (Google Firebase)                     │
│                                                                         │
│   ├── Firebase Authentication (Google OAuth + Email/Password JWTs)      │
│   └── Cloud Firestore (NoSQL Document Store)                            │
│       ├── users/{uid} ── [profile, readingList[], followers[], etc.]   │
│       ├── posts/{postId} ── [content, likes[], viewCount, categories[]] │
│       │   └── comments/{commentId} ── [authorId, text, timestamp]      │
│       └── users/{uid}/notifications/{id} ── [actorId, type, read]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 File & Module Directory
- **Routing & Shell:** [`src/App.jsx`](file:///c:/Projects/my-blog-app/src/App.jsx), [`src/components/MainLayout.jsx`](file:///c:/Projects/my-blog-app/src/components/MainLayout.jsx), [`src/components/Navbar.jsx`](file:///c:/Projects/my-blog-app/src/components/Navbar.jsx)
- **State & Context Providers:** [`src/context/AuthContext.jsx`](file:///c:/Projects/my-blog-app/src/context/AuthContext.jsx), [`src/context/UserProfileContext.jsx`](file:///c:/Projects/my-blog-app/src/context/UserProfileContext.jsx), [`src/context/ThemeContext.jsx`](file:///c:/Projects/my-blog-app/src/context/ThemeContext.jsx)
- **Editor Engine:** [`src/components/BurstEditor.jsx`](file:///c:/Projects/my-blog-app/src/components/BurstEditor.jsx), [`src/pages/PostEditor.jsx`](file:///c:/Projects/my-blog-app/src/pages/PostEditor.jsx)
- **Media & Utilities:** [`src/utils/imageUtils.js`](file:///c:/Projects/my-blog-app/src/utils/imageUtils.js), [`src/components/Avatar.jsx`](file:///c:/Projects/my-blog-app/src/components/Avatar.jsx)
- **Views & Feed:** [`src/pages/HomePage.jsx`](file:///c:/Projects/my-blog-app/src/pages/HomePage.jsx), [`src/pages/SinglePostPage.jsx`](file:///c:/Projects/my-blog-app/src/pages/SinglePostPage.jsx), [`src/pages/Dashboard.jsx`](file:///c:/Projects/my-blog-app/src/pages/Dashboard.jsx), [`src/pages/ProfilePage.jsx`](file:///c:/Projects/my-blog-app/src/pages/ProfilePage.jsx)

---

## 2. State Management, Context & Caching Layer

### 2.1 The N+1 Problem in Micro-Blogging Platforms
In Firestore, a blog post document typically stores `authorId`, `title`, and `content`. If a feed renders 20 posts from 5 unique authors, a naive implementation issues 20 separate `getDoc()` requests for author profiles. As the user scrolls, this leads to:
1. Significant latency and visual pop-in (avatars flashing).
2. Unnecessary Firestore billable read quotas.
3. Network congestion.

### 2.2 Solution: Deduplicated Caching Layer (`src/context/UserProfileContext.jsx`)
Burst implements a centralized in-memory caching provider:
```javascript
// src/context/UserProfileContext.jsx
const [profiles, setProfiles] = useState({}); // { [uid]: userData }
const fetchingIdsRef = useRef(new Set());     // In-flight request deduplication lock
```

#### How it works:
1. Components call `ensureUserProfiles(userIdsArray)` or `ensureUserProfile(userId)`.
2. The function filters out IDs that are **already cached** in `profiles` AND IDs that are **currently in-flight** in `fetchingIdsRef`.
3. The remaining unique IDs are queried in parallel via `Promise.allSettled()`.
4. As documents resolve, they are batched into state via `setProfiles(prev => ({ ...prev, [uid]: data }))`.
5. Every component observing `profiles` (Avatars, Author names, Comment feeds, Notification drawers) re-renders instantly with live cached data.

### 2.3 Authentication Lifecycle (`src/context/AuthContext.jsx`)
- Subscribes to Firebase's `onAuthStateChanged(auth, callback)`.
- When a user logs in via Google Popup (`signInWithPopup`) or Email/Password (`signInWithEmailAndPassword`), `AuthContext` ensures the corresponding `users/{uid}` document exists in Firestore. If missing (first-time Google login), it initializes the user document with empty social arrays (`followers: []`, `following: []`, `readingList: []`).

---

## 3. The Native Burst Story Studio (Custom Editor Engine)

### 3.1 Why We Removed TinyMCE
Earlier versions of Burst used the `@tinymce/tinymce-react` library. While feature-rich, it introduced critical production issues:
1. **Third-Party CDN & API Key Dependency:** Relied on `cdn.tiny.cloud` and external API keys that threw domain mismatch errors in production.
2. **Iframe Isolation:** Rendered inside an `<iframe>`, preventing CSS variable inheritance, causing broken theme switching and high memory consumption.
3. **Bundle Weight:** Added over 100kB to bundle size.

### 3.2 Native Architecture (`src/components/BurstEditor.jsx`)
Burst replaces TinyMCE with **Burst Story Studio**, built directly using the browser's native `contentEditable` interface and the **DOM Selection & Range API**.

#### Key Technical Implementations:
- **Preventing Cursor-Jumping in React:**
  A classic bug with React `contentEditable` is the cursor jumping to position 0 when `innerHTML` updates on keystroke. Burst resolves this by only setting `editorRef.current.innerHTML` **once** on initialization (`initialLoadedRef.current`). Keystrokes invoke `onInput` to update parent state without replacing the editor's live DOM content.
- **Selection Preservation for Modals:**
  When clicking "Insert Link" or "Insert Image", the focus shifts to the modal input, destroying the editor's cursor position. Burst captures the active range before opening the modal:
  ```javascript
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };
  ```
  When the user submits the modal, `restoreSelection()` re-injects the range into the DOM before calling `insertNodeAtSelection()`.
- **Client-Side Canvas Compression (`src/utils/imageUtils.js`):**
  Instead of requiring Firebase Storage buckets or unauthenticated file uploads, the editor includes `compressImageToDataURL()`:
  1. Reads file via `FileReader`.
  2. Draws onto an off-screen `<canvas>` scaled down to `max 1000x700`.
  3. Exports to high-efficiency WebP/JPEG data URL at 82% quality.
  4. Injects an `<img src="data:image/jpeg;base64,...">` tag directly into the article content.

---

## 4. Firestore Schema, Queries & Index Optimization

### 4.1 Data Models

#### `posts/{postId}`
```json
{
  "title": "Scaling React Applications in 2026",
  "content": "<p>Article content...</p>",
  "categories": ["Technology", "React"],
  "status": "published", // "published" | "draft"
  "authorId": "user_uid_123",
  "authorUsername": "Srikanta",
  "authorProfilePic": "data:image/jpeg;base64,...",
  "createdAt": "Timestamp",
  "publishedAt": "Timestamp",
  "lastUpdatedAt": "Timestamp",
  "viewCount": 142,
  "likes": ["uid_1", "uid_2"] // Array of user UIDs who liked the post
}
```

#### `users/{uid}`
```json
{
  "uid": "user_uid_123",
  "username": "srikanta_dev",
  "email": "dev@example.com",
  "bio": "Full-stack engineer building Burst.",
  "profilePictureURL": "data:image/jpeg;base64,...",
  "coverPhotoURL": "https://...",
  "website": "https://example.com",
  "followers": ["uid_4", "uid_5"],
  "following": ["uid_8"],
  "readingList": ["postId_10", "postId_12"],
  "createdAt": "Timestamp"
}
```

### 4.2 Avoiding Firestore Composite Index Failures
In Cloud Firestore, combining `where('status', '==', 'published')` with `orderBy('viewCount', 'desc')` requires a manual composite index deployed in `firestore.indexes.json`. In development or new environments, querying this directly fails with `code=failed-precondition`.

**Burst's Architectural Fix:**
In [`src/pages/HomePage.jsx`](file:///c:/Projects/my-blog-app/src/pages/HomePage.jsx), posts are queried using the single equality filter `where('status', '==', 'published')`. The **Top Trending Post** is computed in-memory:
```javascript
useEffect(() => {
  if (feedType !== 'global' || posts.length === 0) {
    setTopPost(null);
    return;
  }
  const sortedByViews = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  setTopPost(sortedByViews[0] || null);
}, [posts, feedType]);
```
This guarantees zero query failures, zero latency overhead for collections under 1,000 documents, and seamless offline/demo operation.

---

## 5. Layout Engine, Responsive Ordering & Sticky CSS Architecture

### 5.1 Dual-Column Adaptive Ordering ([`src/pages/HomePage.module.css`](file:///c:/Projects/my-blog-app/src/pages/HomePage.module.css))
A critical design requirement:
- **Desktop (`≥ 1024px`):** Main feed on the **left** (`2.7fr`), Trending Post sticky sidebar on the **right** (`1.3fr`).
- **Mobile (`< 1024px`):** Trending Post card must appear **first** at the top of the screen, followed by feed stories underneath.

#### Pure CSS Solution (No Duplicate DOM):
```css
/* Mobile First: Flex Column Ordering */
.contentGrid {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.sidebar {
  order: 1; /* Appears FIRST on mobile screens */
  width: 100%;
}
.mainFeedSection {
  order: 2; /* Appears SECOND on mobile screens */
  width: 100%;
}

/* Desktop: 2-Column CSS Grid */
@media (min-width: 1024px) {
  .contentGrid {
    display: grid;
    grid-template-columns: 2.7fr 1.3fr;
    gap: 2rem;
    align-items: stretch; /* Crucial for sticky child track height */
  }
  .mainFeedSection {
    order: 1;
    grid-column: 1; /* Left Column */
  }
  .sidebar {
    order: 2;
    grid-column: 2; /* Right Column */
    height: 100%;
    position: relative;
  }
}
```

### 5.2 The "Sticky Inside CSS Grid" Quirk
By default, developers set `align-items: flex-start` on CSS Grid containers. In Chromium and WebKit, this clamps the grid item's height to its immediate content, giving a sticky sidebar zero track room to scroll.
**The Fix:** Burst sets `align-items: stretch` on `.contentGrid` and `.sidebar { height: 100%; }`. The inner card `.trendingPostContainer` is given `position: sticky; top: calc(var(--navbar-height) + 4.75rem);`. Because the parent column spans the entire height of the multi-thousand-pixel feed, the card sticks smoothly through the whole reading journey.

### 5.3 Sticky Feed Navigation with Click-Through Margins
The feed selector (`Global Feed` | `Following`) floats stickily under the navbar:
```css
.tabContainer {
  position: sticky;
  top: var(--navbar-height);
  z-index: 35;
  display: flex;
  justify-content: center;
  pointer-events: none; /* Allows clicks through empty space on left/right */
  background: linear-gradient(180deg, var(--bg-page) 75%, transparent);
}
.tabList {
  pointer-events: auto; /* Restores clicks on the pill itself */
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.1);
}
```

---

## 6. Universal Avatar & Resilient Media Processing

### 6.1 The Problem
When users sign up with external URLs or broken image links, standard `<img>` tags display broken placeholder icons and ugly raw alt text (`alt="avatar"`).

### 6.2 The Solution ([`src/components/Avatar.jsx`](file:///c:/Projects/my-blog-app/src/components/Avatar.jsx))
1. **Deterministic Color Hashing:** Hashes the user's name to generate consistent, contrasting background colors (`#4f46e5`, `#059669`, `#d97706`, etc.).
2. **Initials Extraction:** Takes the first letters of the first and last name.
3. **Layered Fallback DOM:**
   ```jsx
   <div className={styles.avatarWrapper}>
     <div className={styles.initialsBadge}>{initials}</div>
     {imgSrc && !hasError && (
       <img
         src={imgSrc}
         alt=""
         className={styles.avatarImage}
         onError={() => setHasError(true)}
       />
     )}
   </div>
   ```
4. If the image fails to load or returns a 404/CORS error, `onError` hides the `<img>` element with `display: none`. The user instantly sees a polished initials badge. Zero layout shifts, zero broken icons.

---

## 7. Creator Analytics & Dashboard Computation Engine

### 7.1 Real-Time KPI Suite ([`src/pages/Dashboard.jsx`](file:///c:/Projects/my-blog-app/src/pages/Dashboard.jsx))
Instead of requiring a backend server or heavy batch worker, the author dashboard computes 8 high-level metrics on the client in real time:
1. **Total Views:** Aggregation of `viewCount` across author's posts.
2. **Net Likes:** Sum of `likes.length` across all author's posts.
3. **Total Comments:** Parallel retrieval using `getCountFromServer(collection(db, 'posts', id, 'comments'))` with `Promise.allSettled`.
4. **Engagement Rate:** `((Total Likes + Total Comments) / Total Views) * 100`.
5. **Total Words Written:** Strips HTML tags and counts tokens across all published drafts.
6. **Estimated Reading Attention:** Total minutes of reading content delivered (`words / 200`).
7. **Audience / Followers:** Extracted from author's profile document `followers.length`.
8. **30-Day Velocity:** Cadence tracking of stories published within the last 30 calendar days.

---

## 8. Social Graph, Activity Feeds & Real-Time Notifications

### 8.1 Atomic Array Mutations
Likes and bookmarks use atomic Firestore operations:
- To Like: `updateDoc(postRef, { likes: arrayUnion(currentUser.uid) })`
- To Unlike: `updateDoc(postRef, { likes: arrayRemove(currentUser.uid) })`
This prevents race conditions when multiple users like an article simultaneously.

### 8.2 Real-Time Notifications ([`src/components/NotificationPanel.jsx`](file:///c:/Projects/my-blog-app/src/components/NotificationPanel.jsx))
- Subscribes to `users/{currentUser.uid}/notifications` ordered by timestamp.
- Intercepts comment, follow, and like events.
- Extracts `actorId` and feeds it to `ensureUserProfiles([actorId])` to resolve live avatar photos and usernames without storing stale data in notification documents.

---

## 9. Zero-Runtime Theme Engine & Typography

### 9.1 CSS Custom Properties vs. CSS-in-JS
Unlike styled-components or Emotion, which inject style tags at runtime and cause layout recalculations, Burst uses pure **CSS Custom Properties** in [`src/index.css`](file:///c:/Projects/my-blog-app/src/index.css):
- Semantic tokens: `--bg-page`, `--bg-surface`, `--text-primary`, `--accent`, `--border-color`.
- Default `:root` (Light Mode) and `[data-theme="dark"]` (Dark Mode).

### 9.2 Avoiding the Dark Mode Flash
[`src/context/ThemeContext.jsx`](file:///c:/Projects/my-blog-app/src/context/ThemeContext.jsx) checks `localStorage.getItem('burst_theme')`. If unset, it queries `window.matchMedia('(prefers-color-scheme: dark)')` and immediately sets `document.documentElement.setAttribute('data-theme', theme)` before render.

---

## 10. Performance, Security & Scalability Blueprint

| Concern | Burst Implementation | Trade-off / Benefit |
| :--- | :--- | :--- |
| **XSS Vulnerabilities** | Controlled inputs; HTML rendering clamped through styled containers in `SinglePostPage` and `BurstEditor`. | Raw HTML is sanitized; future iterations can add `DOMPurify`. |
| **Asset Optimization** | Client-side Canvas downsampling to 82% WebP/JPEG. | No AWS S3/Firebase Storage egress costs; instant thumbnail generation. |
| **Bundle Size** | Removed TinyMCE and Tailwind compile dependencies. Switched to Vite 7 ES modules. | Gzip JS bundle is ~230 kB (dominated by Firebase SDK). |
| **Firestore Read Limits** | In-memory `UserProfileContext` and deduplicated query queues. | Cuts Firestore reads by over 75% on feed navigation. |

---

## 11. Master Technical Interview Question & Answer Bank

### Category 1: High-Level Architecture & Project Overview

#### Q1: "Give me a 60-second elevator pitch of Burst."
> **Answer:** "Burst is a modern, reactive publishing platform built with React 19, Vite, and Firebase. I designed it to solve common pain points in blogging web apps: heavy third-party rich-text editors, layout shift on avatar loading, and lagging feed synchronization. It features a custom native WYSIWYG editor with client-side canvas image compression, an in-memory profile caching engine that eliminates N+1 Firestore read queries, and an adaptive responsive feed that uses pure CSS Grid and Flex ordering to prioritize trending content on mobile while delivering a dual-column sticky layout on desktop."

#### Q2: "Why did you build Burst with a Serverless / BaaS architecture rather than a traditional Node.js/Express and PostgreSQL stack?"
> **Answer:** "I chose Firebase BaaS (Authentication and Cloud Firestore) to leverage real-time data streaming primitives out of the box. Features like live comments, notification badges, and follower feeds require WebSockets or Server-Sent Events in a traditional stack. Firestore's `onSnapshot` listeners allowed me to implement reactive data sync with zero backend boilerplate. For a developer portfolio project, it also allowed me to focus deeply on frontend performance, state architecture, and layout design systems."

#### Q3: "What was the single most difficult technical hurdle you faced in Burst, and how did you overcome it?"
> **Answer:** "The most complex challenge was building the native **Burst Story Studio** to replace TinyMCE. When you build a custom editor on top of `contentEditable`, React's virtual DOM reconciliation causes the cursor to jump to the beginning of the text on every keystroke if state updates overwrite `innerHTML`. I solved this by decoupling the live DOM mutations from React's render loop—only synchronizing `innerHTML` once on mount, and streaming edits upward via `onInput` listeners. Additionally, whenever an author opens a link or image modal, the editor loses focus and the browser destroys the selection. I implemented a selection snapshotting system using the DOM Selection and Range API, saving a cloned range before opening the dialog and restoring it before inserting nodes."

---

### Category 2: React 19, Context API & State Management

#### Q4: "How does state management work across Burst, and why didn't you reach for Redux or Zustand?"
> **Answer:** "Burst's state is divided into two categories: server/remote state and UI state. 
Remote state—such as posts, comments, and notifications—is synchronized directly via Firestore snapshot listeners in custom hooks and page effects. 
For global application state, I used React's native Context API split into three specialized domains: `AuthContext` for user sessions, `ThemeContext` for light/dark switching, and `UserProfileContext` for author caching. Because these contexts represent distinct, low-frequency mutation domains, introducing Redux or Zustand would have added unnecessary boilerplate without measurable performance gains."

#### Q5: "Can you explain how `UserProfileContext` prevents the N+1 problem?"
> **Answer:** "In a NoSQL database like Firestore, post documents contain foreign author IDs (`authorId`). In a feed with 25 posts written by 4 authors, making individual fetch calls results in 25 requests with 21 duplicates. 
`UserProfileContext` acts as an in-memory cache and batching queue. When components render, they register needed IDs via `ensureUserProfiles(ids)`. The context filters out IDs already present in state or currently in-flight in a `useRef` lock. It then dispatches a single batched `Promise.allSettled` query for the missing IDs and updates state once. Subsequent renders from comments, notifications, or cards pull directly from the cached dictionary in O(1) time."

#### Q6: "How did you implement route protection in React Router v7?"
> **Answer:** "I built a `ProtectedRoute` wrapper component ([`src/components/ProtectedRoute.jsx`](file:///c:/Projects/my-blog-app/src/components/ProtectedRoute.jsx)) that consumes `AuthContext`. It inspects `currentUser` and the `loading` flag. If the session is still initializing, it renders a neutral loading fallback to prevent flashing. If initialization completes and `currentUser` is null, it renders `<Navigate to="/login" replace />`. If authenticated, it renders `<Outlet />` wrapped inside `MainLayout`."

---

### Category 3: Cloud Firestore, Real-Time Streams & Index Tuning

#### Q7: "How did you solve the Firestore missing index error (`code=failed-precondition`) when calculating trending posts?"
> **Answer:** "Firestore requires composite indexes whenever you combine an equality filter on one field with an inequality or range sort on another field—for instance, `where('status', '==', 'published')` combined with `orderBy('viewCount', 'desc')`. If that index isn't predeployed, the query throws a fatal `failed-precondition` exception. 
Rather than creating strict index coupling, I queried the published posts stream using only `where('status', '==', 'published')` and derived the Top Trending Post client-side using `Array.prototype.sort()` inside a `useMemo`/`useEffect` hook. For feeds under 500 documents, sorting in V8 engine memory takes less than 1 millisecond and eliminated the database exception completely."

#### Q8: "Why did you use `arrayUnion` and `arrayRemove` for likes and bookmarks instead of a subcollection?"
> **Answer:** "Likes and bookmarks are binary toggle operations per user. If I used a `likes` subcollection (`posts/{id}/likes/{uid}`), checking whether the logged-in user liked 20 posts on a feed would require 20 separate subcollection queries. 
By storing user UIDs in an array field (`likes: string[]`) on the post document:
1. Checking if the user liked the post is an instant in-memory lookup: `post.likes.includes(currentUser.uid)`.
2. Liking is atomic: `updateDoc(ref, { likes: arrayUnion(currentUser.uid) })`.
3. Reading the post automatically provides the like count (`post.likes.length`) without an aggregation query."

#### Q9: "What are the trade-offs of storing arrays in Firestore documents?"
> **Answer:** "The trade-off is the 1 MB Firestore document size limit. If an article went viral and received 100,000 likes, an array of 100,000 28-character UIDs would exceed 2.8 MB, crashing document writes. In a high-scale production redesign, I would move likes to a separate counter aggregation field updated via Cloud Functions or distributed counters, while storing individual like timestamps in a subcollection."

---

### Category 4: Native Burst Editor & Canvas Image Compression

#### Q10: "Walk me through how `compressImageToDataURL` works in `imageUtils.js`."
> **Answer:** "The utility accepts a `File` object from an `<input type="file">`. 
1. It validates the MIME type (`image/*`).
2. Reads it into memory via `FileReader.readAsDataURL()`.
3. Instantiates an HTML `Image` object.
4. When `onload` fires, it calculates proportional aspect-ratio constraints against maximum dimensions (e.g. 1000px width, 700px height).
5. Creates an off-screen `<canvas>` element and draws the scaled image via `canvas.getContext('2d').drawImage()`.
6. Exports the canvas to `canvas.toDataURL('image/jpeg', 0.82)`.
This reduces a 5 MB camera upload to approximately 60–120 kB, allowing direct embedding into Firestore documents without storage bucket overhead."

#### Q11: "How do you handle keyboard shortcuts in `BurstEditor`?"
> **Answer:** "I attached an `onKeyDown` listener to the `contentEditable` div. It checks `e.ctrlKey || e.metaKey` (supporting both Windows and macOS). When detected:
- `key === 'b'` calls `document.execCommand('bold')`
- `key === 'i'` calls `document.execCommand('italic')`
- `key === 'k'` opens the in-app hyperlink modal
- `key === 'Tab'` prevents the default focus change and inserts non-breaking spaces
After executing commands, I call an internal sync helper to immediately reflect the formatting in state."

---

### Category 5: CSS Modules, Responsive Grid/Flex & Sticky Positioning

#### Q12: "Why did you use CSS Modules instead of Tailwind CSS or styled-components?"
> **Answer:** "I used pure CSS Modules coupled with semantic CSS custom properties. 
Compared to Tailwind CSS, CSS Modules keep JSX clean and readable without 20-class string clutter, while strictly scoping classnames at build time to prevent specificity collisions. 
Compared to styled-components or Emotion, CSS Modules compile to static `.css` files at build time with zero JavaScript runtime overhead, zero style injection cost, and seamless server-side or static asset caching."

#### Q13: "How did you achieve different layout orders on mobile vs desktop without duplicating DOM elements?"
> **Answer:** "In [`src/pages/HomePage.jsx`](file:///c:/Projects/my-blog-app/src/pages/HomePage.jsx), the DOM contains `<main className={styles.mainFeedSection}>` and `<aside className={styles.sidebar}>`. 
On mobile (`< 1024px`), the parent is a Flexbox container with `flex-direction: column`. I set `.sidebar { order: 1; }` and `.mainFeedSection { order: 2; }`. The browser renders the Trending Post first at the top of the mobile viewport. 
On desktop (`≥ 1024px`), the parent switches to CSS Grid with `grid-template-columns: 2.7fr 1.3fr`. I set `.mainFeedSection { order: 1; grid-column: 1; }` and `.sidebar { order: 2; grid-column: 2; }`. The stories flow on the left and the trending card rests on the right. One clean DOM, two responsive experiences."

#### Q14: "Why does `position: sticky` fail inside CSS Grid, and how did you resolve it?"
> **Answer:** "By default, developers often place `align-items: start` on a CSS Grid container. When they do, the grid item's height collapses to its own content height. Because a sticky element can only move within the boundaries of its parent element, an element inside a collapsed grid item has nowhere to travel. 
I resolved this by setting `align-items: stretch` on the grid parent, setting the `.sidebar` column wrapper to `height: 100%` (stretching it to match the multi-thousand-pixel feed), and placing `position: sticky; top: calc(var(--navbar-height) + 4.75rem);` on the inner card. The card sticks smoothly alongside the entire feed."

#### Q15: "What is the difference between `overflow: hidden` and `overflow: clip`, and why does it matter for sticky elements?"
> **Answer:** "`overflow: hidden` creates a scroll container (even if scrollbars are hidden). According to the CSS specification, an element with `position: sticky` will stick relative to its nearest ancestor that is a scroll container. Setting `overflow-x: hidden` on `html` or `body` intercepts the scroll context and completely breaks `position: sticky` on headers and sidebars. 
`overflow: clip`, introduced in modern CSS, simply clips overflow content along the specified axis without creating a scroll container. Switching `overflow-x: hidden` to `overflow-x: clip` in [`src/index.css`](file:///c:/Projects/my-blog-app/src/index.css) allowed me to prevent horizontal page jitter while keeping all sticky navigation and sidebars functional."

---

### Category 6: Performance, Web Vitals & Security

#### Q16: "How do you protect against XSS when rendering user-generated article content?"
> **Answer:** "Articles are rendered using `dangerouslySetInnerHTML={{ __html: post.content }}` on `SinglePostPage`. 
In Burst Story Studio, user input is generated through controlled formatting buttons and sanitized paste handlers that strip `<script>` tags and executable event handlers (`onload`, `onerror`). 
In an enterprise production deployment, I would run all article HTML through `DOMPurify` on both client-side submission and server-side write hooks before persisting to Firestore."

#### Q17: "How did you measure and optimize bundle size with Vite?"
> **Answer:** "I analyzed build chunks using Vite's Rollup output logs. By removing `@tinymce/tinymce-react` and unused Tailwind plugins, the production bundle was reduced significantly. The final production bundle outputs ~117 kB of modular CSS and ~750 kB of minified JS (~230 kB gzipped), with the majority of weight coming from the modular Firebase SDK. In the future, I can configure `build.rollupOptions.output.manualChunks` to split the Firebase SDK into a separate cached vendor chunk."

---

### Category 7: Scenario-Based Debugging & Edge Cases

#### Q18: "A user reported that author profile pictures showed broken image icons and raw alt text across comments and cards. How did you diagnose and solve this?"
> **Answer:** "The issue stemmed from two causes:
1. External image URLs (like Google account photos or third-party links) that had expired, suffered from CORS restrictions, or returned 404s.
2. Standard `<img>` tags displaying browser-native broken icon glyphs and alt text.
I built the universal [`Avatar.jsx`](file:///c:/Projects/my-blog-app/src/components/Avatar.jsx) component. It renders a background initials badge with a deterministic color hash based on the user's name. An `<img>` tag is layered on top with `alt=""` and an `onError` handler. If the URL fails, `onError` flips internal state to hide the image tag entirely, cleanly revealing the initials badge underneath. Broken images never leak to the UI."

#### Q19: "An author accidentally double-clicked 'Publish' and created two duplicate blog posts. How did you prevent this?"
> **Answer:** "In [`src/pages/PostEditor.jsx`](file:///c:/Projects/my-blog-app/src/pages/PostEditor.jsx), I introduced an `isSaving` boolean state. When the author clicks 'Publish' or 'Save Draft', `isSaving` immediately flips to `true`, disabling the submit buttons and displaying a spinner ('Publishing...'). The write operation is wrapped in a `try...finally` block that only unlocks the button if an error occurs, or navigates away to the dashboard upon success."

#### Q20: "How does the reading progress bar on `SinglePostPage` calculate its percentage?"
> **Answer:** "In [`src/pages/SinglePostPage.jsx`](file:///c:/Projects/my-blog-app/src/pages/SinglePostPage.jsx), I register a passive scroll listener:
```javascript
const handleScroll = () => {
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (totalHeight > 0) {
    const progress = (window.scrollY / totalHeight) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  }
};
```
The percentage directly drives the inline width of a fixed gradient bar at `top: 0` (`<div style={{ width: `${scrollProgress}%` }} />`). It provides immediate, smooth feedback on reading progress."

---

## 12. Master Behavioral, Project Management & Non-Technical Interview Bank

### Category 8: Personal Narrative, Motivation & Engineering Philosophy

#### Q21: "Tell me about yourself, your background, and how Burst reflects your journey as a software engineer."
> **Answer:** "I am a full-stack engineer who loves building high-performance, user-centric web applications. My journey started with small utility scripts and frontend prototypes, but I quickly realized that to become a truly well-rounded engineer, I needed to build a comprehensive, production-grade application that addresses the full software lifecycle—from state management and database design down to micro-interactions and performance optimization.
Burst is the culmination of that journey. It represents my shift from simply 'making things work' to 'engineering systems with resilience.' Throughout Burst, I didn't settle for quick third-party shortcuts: when an external rich-text editor proved fragile, I built a native one; when image uploads threatened database limits, I wrote a client-side canvas compression pipeline; when sticky layouts broke in modern browsers, I researched CSS rendering specifications to fix them at the root. Burst showcases my dedication to clean code, defensive architecture, and user empathy."

#### Q22: "What was the initial inspiration behind Burst? What problem were you trying to solve?"
> **Answer:** "The inspiration struck after I finished reading a thought-provoking book and wanted to write an in-depth review to share with other readers. When looking at existing blogging platforms, I noticed two extremes: either they were bloated, ad-ridden walled gardens with aggressive paywalls, or they were bare-bones markdown tools that were unapproachable for everyday writers.
I wanted to build **Burst** as a middle ground: a fast, distraction-free publishing space where great ideas can 'burst into life.' I wanted writers to experience an intuitive visual editor without sluggish iframes, authors to get honest analytics on their reader attention and cadence, and readers to browse chronologically without opaque engagement algorithms burying good content."

#### Q23: "What is your philosophy on writing code, and how is it reflected in the Burst codebase?"
> **Answer:** "My engineering philosophy rests on three pillars:
1. **Simplicity over cleverness:** I prefer predictable, readable code over overly complex abstractions. For instance, in `HomePage.jsx`, rather than building a tangled web of stateful re-sorting hooks, I used native array manipulation and CSS flex/grid ordering.
2. **Defensive design:** Assume external services and user inputs will fail. My `Avatar.jsx` component assumes image links will break, and my `PostEditor.jsx` assumes users might double-click buttons or paste malformed markup.
3. **Zero-cost UI abstractions:** Avoid heavy runtime dependencies where native browser APIs exist. By utilizing CSS Modules, CSS custom properties, and native `contentEditable`, Burst delivers a sub-15ms interaction response time without runtime CSS-in-JS compilation overhead."

---

### Category 9: Decision Making, Trade-offs & Scope Prioritization

#### Q24: "How did you manage project scope and prioritize features while building Burst as a solo developer?"
> **Answer:** "Building a full-stack platform alone presents an endless temptation for feature creep. To stay disciplined, I used a modified MoSCoW prioritization framework (Must-have, Should-have, Could-have, Won't-have):
- **Sprint 1 (Core Must-Haves):** Authentication (Google & Email/Password), Firestore document schemas, core CRUD for blog posts, and the basic reader view.
- **Sprint 2 (Social & Engagement):** Real-time likes, comments, and the reading list.
- **Sprint 3 (UX Polish & Architecture):** Replacing TinyMCE with Burst Story Studio, dark/light theme switching, and responsive sticky layout tuning.
- **Deferred (Won't-Have for V1):** Algolia full-text search indexing and complex multi-author publication tiers.
By keeping the primary user loop—*Discover → Read → Write → Engage*—functional at all times, I was able to continuously iterate without finding myself stuck with broken, half-implemented features."

#### Q25: "Can you describe a major architectural trade-off you made in this project?"
> **Answer:** "A significant trade-off was storing likes and bookmarks as arrays directly on the `posts` and `users` documents (`likes: string[]`, `readingList: string[]`) rather than creating separate subcollections (`posts/{id}/likes/{uid}`).
- **The Upside:** Drastically simplified queries and eliminated cost. When rendering a feed of 20 posts, checking if the current user liked each post is an instantaneous in-memory array check (`post.likes?.includes(user.uid)`). A subcollection approach would have required 20 additional subcollection reads per page view.
- **The Trade-off:** Scalability ceiling. Firestore documents have a 1 MB size limit. If an article received 50,000 likes, storing all UIDs in an array would eventually hit document capacity.
- **Decision Rationale:** For an independent blogging platform scaling up to thousands of active creators, the read cost savings and latency reduction heavily outweighed the theoretical risk of hitting the 1 MB limit. In a future hyper-scale refactor, I would separate likes into a counter field updated by Cloud Functions."

#### Q26: "Why did you build your own native rich-text editor instead of using an established library like Slate.js, Quill, or Lexical?"
> **Answer:** "When I decided to remove TinyMCE, I evaluated Slate.js and Lexical. While powerful, those libraries have steep learning curves, add 80–150 kB of runtime bundle weight, and introduce heavy state management dependencies.
Because Burst's editing requirements centered on clean blogging prose—headings, bold/italic, lists, blockquotes, code snippets, hyperlinks, and optimized visual insertion—I realized I could achieve 100% of the required functionality using the native browser `contentEditable` interface and the DOM Selection API in less than 400 lines of clean React code. This kept the bundle lightweight, gave me total styling control through CSS Modules, and eliminated third-party package breaking changes."

---

### Category 10: Failures, Mistakes & Handling Feedback (STAR Stories)

#### Q27: "Tell me about a time you made a technical mistake or bad architectural choice in Burst and how you corrected it." *(STAR Method)*
> **Answer:**
- **Situation:** Early in the project, I relied on `@tinymce/tinymce-react` for post creation and assumed that Tailwind CSS v4 would automatically compile utilities in my development build without checking the post-CSS processing pipeline.
- **Task:** As I tested the production deployment, external CDN scripts for TinyMCE began throwing API domain-verification errors, and uncompiled Tailwind classes were leaking unstyled text across the editor and auth screens.
- **Action:** I recognized that relying on an external black-box editor and an unconfigured CSS pipeline was undermining project stability. I executed an architectural pivot: I uninstalled `@tinymce/tinymce-react`, stripped out uncompiled utility strings, designed the native `BurstEditor` from scratch with HTML5 Canvas image downsampling, and rebuilt all application styling using scoped CSS Modules with semantic CSS custom properties.
- **Result:** The production build succeeded in 6.5 seconds with zero ESLint errors, external third-party CDN dependencies were reduced to zero, and the editor seamlessly inherited the app's Dark and Light theme tokens without iframes."

#### Q28: "Tell me about a time you received constructive feedback or a bug report from a user, and how you responded." *(STAR Method)*
> **Answer:**
- **Situation:** During user testing, a tester with an older Google profile photo pointed out that their avatar showed a broken image icon with raw alt text on comment sections. Another user testing on a mobile device noted that the Top Trending Post was buried at the very bottom beneath 15 other articles.
- **Task:** I needed to address both feedback items to elevate the app from a hobby project to an accessible, industry-grade experience.
- **Action:** For the avatars, I engineered [`Avatar.jsx`](file:///c:/Projects/my-blog-app/src/components/Avatar.jsx) with deterministic name hashing to generate colored initials badges underneath, using `onError` to silently hide broken images without layout shifts. For the mobile layout, I re-architected [`HomePage.module.css`](file:///c:/Projects/my-blog-app/src/pages/HomePage.module.css) using CSS flex `order: 1` on mobile to lift the Trending Post card to the top, while keeping it as a sticky right sidebar on desktop screens.
- **Result:** The user interface felt instantly more resilient and polished. The tester praised the initials fallback, and mobile readers immediately engaged with the featured trending story upon loading the feed."

#### Q29: "Describe a situation where you hit a technical dead end and how you unblocked yourself." *(STAR Method)*
> **Answer:**
- **Situation:** While implementing the desktop feed layout, I attempted to make the Trending Post sidebar sticky using CSS `position: sticky; top: calc(var(--navbar-height) + 1.5rem);`. Despite valid syntax, the card refused to stick and scrolled off the screen as if it were statically positioned.
- **Task:** I needed to diagnose why the browser engine was refusing to compute the sticky scroll boundary inside a multi-column grid layout.
- **Action:** Instead of blindly changing CSS rules, I researched the CSS Positioning and Box Alignment specifications. I discovered two root causes:
  1. An ancestor element had `overflow-x: hidden`, which modern browsers treat as an established scroll container, clipping child sticky contexts.
  2. The parent CSS Grid had `align-items: flex-start`, which collapsed the sidebar column's track height to the height of the card itself, leaving zero vertical room for the sticky card to travel.
  I replaced `overflow-x: hidden` with modern `overflow-x: clip` in [`src/index.css`](file:///c:/Projects/my-blog-app/src/index.css), set `align-items: stretch` on `.contentGrid`, and gave the sidebar `height: 100%`.
- **Result:** The sidebar stuck smoothly and reliably across Chromium, Firefox, and Safari on desktop viewports."

---

### Category 11: Teamwork, Product Strategy & Future Roadmap

#### Q30: "How would you onboard a new developer to the Burst codebase on day one?"
> **Answer:** "I believe clean code is only as good as its documentation. To onboard a new engineer:
1. **Repository Setup:** I would point them to the refurbished [`README.md`](file:///c:/Projects/my-blog-app/README.md) and [`PROJECT_ANALYSIS.md`](file:///c:/Projects/my-blog-app/PROJECT_ANALYSIS.md), which clearly outline prerequisites, environment variable configuration, and architectural rationale.
2. **Architecture Walkthrough:** I would walk them through the data lifecycle: starting from Firebase Auth in `AuthContext.jsx`, tracing how a post is drafted in `BurstEditor.jsx`, saved to Cloud Firestore, cached in `UserProfileContext.jsx`, and rendered responsively in `HomePage.jsx`.
3. **First Good Issue:** I would pair with them on a well-defined starter task—such as adding a tag filter chips bar on `CategoryPage.jsx`—so they can become comfortable with the CSS Module design system and Firestore snapshot subscriptions."

#### Q31: "How do you explain the technical architecture of Burst to a non-technical stakeholder or product manager?"
> **Answer:** "I translate the technical mechanics into direct user benefits:
- *Instead of saying 'Firestore onSnapshot subscriptions':* I explain that Burst uses real-time live synchronization—much like a live sports score—so when someone likes your post or leaves a comment, it appears on your screen instantly without needing to manually refresh the page.
- *Instead of saying 'HTML5 Canvas downsampling':* I explain that we optimize images directly inside the author's browser before sending them over the internet, which keeps the app lightning fast for readers on slow mobile connections and eliminates expensive cloud storage bills.
- *Instead of saying 'CSS Custom Properties':* I explain that our Dark Mode switch changes visual themes instantly with zero flicker or stutter, making reading comfortable late at night."

#### Q32: "If you had an additional 4 weeks and a budget, what would you build next on the Burst roadmap?"
> **Answer:** "I would prioritize four strategic milestones:
1. **Server-Side Rendering (SSR) / Next.js Migration:** For a publishing platform, organic search discovery is paramount. Migrating from client-side SPA rendering to SSR would allow search engines (Google, Bing) to index article text and OpenGraph preview images dynamically for social sharing.
2. **Full-Text Search Engine:** Integrate Algolia or Typesense to allow instant, typo-tolerant search across post titles, article bodies, and author usernames.
3. **Collaborative Multi-Author Publications:** Allow creators to form 'Publications' with shared branding, editor review workflows, and contributor invitations.
4. **Automated Testing Suite:** Introduce end-to-end testing with Playwright to verify core critical flows (login, rich-text drafting, publishing, following) on every pull request via GitHub Actions."

#### Q33: "What did building Burst teach you that tutorials, university coursework, or bootcamps never did?"
> **Answer:** "Tutorials show the 'happy path' where databases never reject queries, network connections never drop, and images never fail to load. 
Building Burst independently taught me the reality of production engineering:
- It taught me **defensive programming**: handling race conditions during simultaneous user likes, catching CORS failures on external images, and gracefully managing empty states.
- It taught me **performance discipline**: recognizing when a third-party package is too heavy and having the confidence to write a native solution from scratch.
- Most importantly, it taught me **architectural empathy**: understanding that good software engineering isn't about using the trendiest libraries, but about delivering a fast, dependable, and enjoyable experience to the end user."
