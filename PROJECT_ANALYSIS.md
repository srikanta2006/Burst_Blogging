# Comprehensive Project Analysis & Architecture Specification

**Project Name:** Burst (internally referenced as `my-blog-app` and legacy `Blogzilla`)  
**Workspace Root:** `c:\Projects\my-blog-app`  
**Analysis Date:** November 7, 2026  
**Analyst:** Senior Software Engineer (AI Pair Programmer)  
**Status:** Reconnaissance Phase Complete (No Source Modifications Made)

---

## 1. Project Overview

### 1.1 Purpose and Vision
The application—branded primarily as **"Burst"** (with residual code references to **"Blogzilla"** and repository package name **"my-blog-app"**)—is a full-stack, single-page web blogging platform designed for content creators and readers. It enables users to write, publish, and manage rich-text articles, discover published stories across categories, engage with other writers through social mechanisms (likes, comments, bookmarks, and user follows), and receive real-time notifications.

### 1.2 Core Capabilities
- **Authentication & User Management:** Email/password and Google OAuth authentication managed through Firebase Authentication. User profiles feature usernames, bios, location, date of birth, profile pictures, and follower/following metrics.
- **Rich-Text Publishing:** Content creation and draft management using the TinyMCE WYSIWYG editor, category tagging, and dual publication states (`draft` vs `published`).
- **Real-Time Social Interactions:** Interactive like counts, bookmarking to a personal reading list, commenting threads under posts, and bidirectional user following relationships powered by Cloud Firestore real-time snapshot listeners.
- **Content Discovery & Analytics:** Global feed sorted chronologically, author following feed, top trending post sidebar based on view counts, category-filtered post views, and author dashboards with aggregate post metrics (views, likes, comments).
- **In-App Notifications:** Subcollection listener alerting authors when comments are posted on their articles.

### 1.3 Architectural Topology
The application operates on a **Serverless / Backend-as-a-Service (BaaS)** model:
- **Client Tier:** A single-page application (SPA) built using **React 19** and **Vite 7**, using client-side routing via **React Router DOM v7**.
- **Service & Persistence Tier:** **Google Firebase 12**, integrating Firebase Authentication, Cloud Firestore (NoSQL document store), and prepared hosting infrastructure. All business logic, data persistence, and queries are executed directly from client-side services to Firestore via the Firebase JavaScript SDK.
- **Styling Architecture:** A hybrid system combining **Tailwind CSS 4** utility classes with localized **CSS Modules** (`*.module.css`).

---

## 2. Technology Stack & Dependency Analysis

### 2.1 Complete Dependency Manifest (`package.json`)

#### Production Dependencies
| Package | Version | Usage Scope | Rationale / Architectural Role | Evaluation & Health |
|---|---|---|---|---|
| `react` | `^19.1.0` | Global UI runtime | Core component framework for reactive view rendering. | Latest React major version; stable. |
| `react-dom` | `^19.1.0` | Global DOM entry | React reconciliation engine mounting to `#root`. | Healthy. |
| `react-router-dom` | `^7.7.1` | `src/App.jsx`, pages, components | Client-side routing, route protection, URL parameter parsing (`useParams`, `useNavigate`, `Link`, `Outlet`). | Current React Router v7 release; well integrated. |
| `firebase` | `^12.0.0` | `src/firebase/config.js`, all data modules | BaaS SDK handling Auth, Firestore queries, document updates, and Storage stubs. | Firebase JS SDK v12 modular format. |
| `@tinymce/tinymce-react`| `^6.3.0` | `src/pages/PostEditor.jsx` | Official TinyMCE React wrapper for WYSIWYG rich-text content editing. | Functional; relies on external TinyMCE Cloud CDN. |
| `lucide-react` | `^0.536.0` | Across UI components and pages | SVG icon library providing uniform glyphs (Heart, Bell, Bookmark, Share, etc.). | Modern, tree-shakeable icon suite. |

#### Development Dependencies
| Package | Version | Usage Scope | Rationale / Architectural Role | Evaluation & Health |
|---|---|---|---|---|
| `vite` | `^7.0.4` | Build tool & Dev server | Fast ESM bundler with Hot Module Replacement (HMR). | Modern; version in lockfile is v7.0.6. |
| `@vitejs/plugin-react` | `^4.6.0` | `vite.config.js` | Fast Refresh and JSX transformation plugin. | Healthy. |
| `tailwindcss` | `^4.1.11` | Styling layer | Utility CSS generation. | Config location and syntax mismatch with v4 standards (detailed in Section 16). |
| `postcss` | `^8.5.6` | CSS compilation | CSS AST processor driving Tailwind and Autoprefixer. | Placed in `src/postcss.config.js` rather than root. |
| `autoprefixer` | `^10.4.21` | CSS compilation | Vendor prefix injector for cross-browser CSS support. | Healthy. |
| `eslint` | `^9.30.1` | Static code analysis | Linter using modern flat configuration (`eslint.config.js`). | Lint suite currently fails due to unhandled variables and React refresh warnings. |
| `eslint-plugin-react-hooks` | `^5.2.0` | Code quality | Enforces Rules of Hooks. | Flags missing deps in `UserSettingsPage.jsx`. |
| `eslint-plugin-react-refresh` | `^0.4.20`| Code quality | Ensures fast-refresh compatibility. | Flags mixed export in `AuthContext.jsx`. |
| `globals` | `^16.3.0` | Linter environment | Defines standard browser globals for ESLint flat config. | Healthy. |
| `@types/react` | `^19.1.8` | IDE intellisense | TypeScript definitions for React. | Healthy dev dependency. |
| `@types/react-dom` | `^19.1.6` | IDE intellisense | TypeScript definitions for ReactDOM. | Healthy dev dependency. |

---

## 3. Complete Directory Structure

```
c:\Projects\my-blog-app\
├── .firebase/                                 # Firebase deployment cache and hosting artifacts
│   ├── hosting.cHVibGlj.cache
│   └── hosting.ZGlzdA.cache
├── .git/                                      # Git version control metadata
├── dist/                                      # Vite production build artifacts (auto-generated)
│   ├── assets/
│   │   ├── index-Cf4zDZJY.css                 # Compiled CSS bundle (41.88 kB)
│   │   └── index-D41030MI.js                  # Minified JavaScript bundle (792.24 kB)
│   ├── index.html                             # Compiled production entry HTML
│   └── vite.svg                               # Static Vite logo copied during build
├── node_modules/                              # Installed npm dependencies
├── public/                                    # Static assets served untouched by Vite
│   ├── assets/
│   │   └── images/
│   │       ├── home-page.png                  # Showcase screenshot for README/docs
│   │       └── login-page.png                 # Showcase screenshot for README/docs
│   ├── index.html                             # Firebase Hosting default boilerplate (conflicts with root index.html)
│   └── vite.svg                               # Default Vite favicon
├── src/                                       # Application source code
│   ├── assets/
│   │   └── react.svg                          # Default React SVG logo
│   ├── components/                            # Modular and reusable UI components
│   │   ├── components/                        # UNTRACKED DUPLICATE NESTED DIRECTORY
│   │   │   └── Avatar.jsx                     # Outdated duplicate of Avatar component (Dead Code)
│   │   ├── ActionButtons.module.css           # Styling for Like and Bookmark icon buttons
│   │   ├── Avatar.jsx                         # Reusable user avatar with letter-hash fallback
│   │   ├── Avatar.module.css                  # Scoped styling for Avatar component
│   │   ├── BookmarkButton.jsx                 # User reading list toggle button
│   │   ├── CommentSection.jsx                 # Comments feed, comment author avatars, submission form
│   │   ├── CommentSection.module.css          # Scoped styling for CommentSection
│   │   ├── FollowButton.jsx                   # Bidirectional follow/unfollow toggle button
│   │   ├── FollowButton.module.css            # Scoped styling for FollowButton
│   │   ├── LikeButton.jsx                     # Post heart like/unlike toggle button
│   │   ├── MainLayout.jsx                     # Shared container wrapper rendering Navbar & Outlet
│   │   ├── Navbar.jsx                         # Top navigation header with responsive dropdown
│   │   ├── Navbar.module.css                  # Scoped styling for Navbar
│   │   ├── NotificationPanel.jsx              # Flyout panel displaying user comment notifications
│   │   ├── NotificationPanel.module.css       # Scoped styling for NotificationPanel
│   │   ├── ProtectedRoute.jsx                 # Route guard redirecting unauthenticated users to /login
│   │   ├── ShareButton.jsx                    # Native share API trigger with clipboard copy fallback
│   │   └── ShareButton.module.css             # Scoped styling for ShareButton
│   ├── context/
│   │   └── AuthContext.jsx                    # React Context managing currentUser and auth state
│   ├── firebase/
│   │   └── config.js                          # Firebase App, Auth, Firestore, and Storage initialization
│   ├── hooks/
│   │   └── useClickOutside.js                 # Reusable hook detecting outside pointer events for modals/dropdowns
│   ├── pages/                                 # Top-level route views
│   │   ├── AuthForm.module.css                # Shared styling for Login and SignUp pages
│   │   ├── CategoryPage.jsx                   # Feed displaying posts matching specific category tag
│   │   ├── Dashboard.jsx                      # Author management dashboard with post analytics
│   │   ├── Dashboard.module.css               # Scoped styling for Dashboard
│   │   ├── HomePage.jsx                       # Main feed (Global and Following feeds + Trending sidebar)
│   │   ├── HomePage.module.css                # Scoped styling for HomePage
│   │   ├── LandingPage.jsx                    # Marketing landing page with author story and CTA
│   │   ├── LandingPage.module.css             # Scoped styling for LandingPage
│   │   ├── Login.jsx                          # Email/password and Google OAuth login view
│   │   ├── PostEditor.jsx                     # TinyMCE article editor for creating and editing posts
│   │   ├── PostEditor.module.css              # Scoped styling for PostEditor
│   │   ├── ProfileEditPage.jsx                # Form to modify author bio, username, and picture URLs
│   │   ├── ProfileEditPage.module.css         # Scoped styling for ProfileEditPage
│   │   ├── ProfilePage.jsx                    # Public profile displaying author metrics and published posts
│   │   ├── ProfilePage.module.css             # Scoped styling for ProfilePage
│   │   ├── ReadingListPage.jsx                # Saved articles collection view
│   │   ├── ReadingListPage.module.css         # Scoped styling for ReadingListPage
│   │   ├── SignUp.jsx                         # Registration view for email/password and Google OAuth
│   │   ├── SinglePostPage.jsx                 # Full article view, view incrementer, author card, and comments
│   │   ├── SinglePostPage.module.css          # Scoped styling for SinglePostPage
│   │   └── UserSettingsPage.jsx               # Tabbed settings view (Stubbed implementation / Unrouted)
│   ├── styles/
│   │   └── globals.css                        # Standalone CSS design system tokens (Orphaned / Unreferenced)
│   ├── App.css                                # Vite boilerplate styling (Orphaned / Unreferenced)
│   ├── App.jsx                                # Root application component declaring routing hierarchy
│   ├── index.css                              # Global CSS entrypoint importing Tailwind directives
│   ├── main.jsx                               # React DOM client entrypoint wrapping App in AuthProvider
│   ├── postcss.config.js                      # PostCSS config file located inside src (Misplaced)
│   └── tailwind.config.js                     # Tailwind CSS v3-style config located inside src (Misplaced)
├── .firebaserc                                # Firebase CLI project alias binding (`mybloggingapp-c3d04`)
├── .gitignore                                 # Git ignore patterns
├── eslint.config.js                           # Modern ESLint Flat Configuration
├── firebase.json                              # Firebase Hosting deployment settings
├── index.html                                 # Root application HTML template for Vite
├── package-lock.json                          # Exact locked dependency tree
├── package.json                               # Application metadata, scripts, and dependencies
├── README.md                                  # Developer documentation and project guide
└── vite.config.js                             # Vite configuration with React plugin
```

---

## 4. Module-by-Module Code Analysis

### 4.1 Core Application Lifecycle & Configuration

#### `src/main.jsx`
- **Location:** `src/main.jsx`
- **Role:** Mounts the application to the DOM.
- **Imports:** `React`, `ReactDOM`, `App`, `AuthProvider` from `./context/AuthContext.jsx`, `./index.css`.
- **Implementation:** Wraps `<App />` inside `<React.StrictMode>` and `<AuthProvider>`. Executes `ReactDOM.createRoot(document.getElementById('root')).render(...)`.

#### `src/App.jsx`
- **Location:** `src/App.jsx`
- **Role:** Central routing definition using `react-router-dom` v7.
- **Components:** `App()` and `AppWithRouter()`.
- **Routes Declared:**
  - Public Routes: `/` (LandingPage), `/signup` (SignUp), `/login` (Login).
  - Protected Routes (Nested in `ProtectedRoute` and `MainLayout`):
    - `/home` &rarr; `HomePage`
    - `/post/:postId` &rarr; `SinglePostPage`
    - `/category/:categoryName` &rarr; `CategoryPage`
    - `/profile/:userId` &rarr; `ProfilePage`
    - `/edit-profile` &rarr; `ProfileEditPage`
    - `/edit-post/:postId` &rarr; `PostEditor`
    - `/create-post` &rarr; `PostEditor`
    - `/dashboard` &rarr; `Dashboard`
    - `/reading-list` &rarr; `ReadingListPage`
- **Observations:** Does NOT include routes for `/explore` (linked from `LandingPage`) or `/settings` (for `UserSettingsPage`).

#### `src/firebase/config.js`
- **Location:** `src/firebase/config.js`
- **Role:** Initializes and exports Firebase service instances (`auth`, `db`, `storage`).
- **Configuration Object:**
  ```javascript
  const firebaseConfig = {
    apiKey: "AIzaSyBDsoTEPcplN8cw6KtuoQfDonFA6XJBk3w",
    authDomain: "mybloggingapp-c3d04.firebaseapp.com",
    projectId: "mybloggingapp-c3d04",
    storageBucket: "mybloggingapp-c3d04.firebasestorage.app",
    messagingSenderId: "430252143768",
    appId: import.meta.env.VITE_APP_ID
  };
  ```
- **Observations:** Firebase credentials (`apiKey`, `authDomain`, `projectId`, etc.) are hardcoded, while `appId` relies on `import.meta.env.VITE_APP_ID`. However, there is no `.env` file present, leaving `appId` undefined.

#### `src/context/AuthContext.jsx`
- **Location:** `src/context/AuthContext.jsx`
- **Role:** Manages client-side authentication state using Firebase's `onAuthStateChanged` listener.
- **Exported Symbols:** `useAuth()` (hook), `AuthProvider({ children })` (component).
- **State Exposed:** `{ currentUser, logout }`.
- **Behavior:** Renders `{!loading && children}`. This means the entire application renders a blank screen until Firebase completes its initial token evaluation.
- **ESLint Finding:** Violates `react-refresh/only-export-components` because it exports both a React component (`AuthProvider`) and a custom hook (`useAuth`) from the same file.

#### `src/hooks/useClickOutside.js`
- **Location:** `src/hooks/useClickOutside.js`
- **Role:** Attaches `mousedown` and `touchstart` event listeners to `document` to invoke a callback when clicking outside an element identified by a React `ref`.
- **Consumers:** `Navbar.jsx` (profile dropdown) and `NotificationPanel.jsx` (notifications flyout).

---

### 4.2 Reusable UI Components

#### `src/components/MainLayout.jsx`
- **Location:** `src/components/MainLayout.jsx`
- **Role:** Outer layout shell for all authenticated views.
- **Structure:** Renders sticky `<Navbar />` followed by `<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"><Outlet /></main>`.

#### `src/components/ProtectedRoute.jsx`
- **Location:** `src/components/ProtectedRoute.jsx`
- **Role:** Guards route subtrees by verifying `currentUser`. If `null`, redirects to `/login` via `<Navigate to="/login" />`. Otherwise renders children.

#### `src/components/Navbar.jsx`
- **Location:** `src/components/Navbar.jsx`
- **Role:** Global header navigation bar.
- **Elements:**
  - Branding: Text logo "Burst" linking to `/`.
  - Unauthenticated State: Links to `/login` and `/signup`.
  - Authenticated State:
    - "Create Post" button (hidden on mobile, visible on `md:` breakpoints).
    - `<NotificationPanel />` bell toggle.
    - User avatar linking to `/profile/${currentUser.uid}`.
    - Hamburger icon toggling a dropdown containing links to Home (`/`), Dashboard (`/dashboard`), Reading List (`/reading-list`), and Logout button.
- **Limitation:** The "Home" link routes to `/` (LandingPage), which then redirects authenticated users to `/home`.

#### `src/components/Avatar.jsx` (and `src/components/components/Avatar.jsx`)
- **Location:** `src/components/Avatar.jsx`
- **Role:** Renders user avatar image or generates a colored circular initial badge if `src` is absent.
- **Logic:** Converts username string to a deterministic hex color code via ASCII bit-shift hashing.
- **Duplicate Anomaly:** An exact earlier version exists at `src/components/components/Avatar.jsx`. It imports `./Avatar.module.css` (which does not exist in that nested directory) and lacks the `.profilePicture` scaling rule. It is completely unreferenced and represents dead code.

#### `src/components/LikeButton.jsx`
- **Location:** `src/components/LikeButton.jsx`
- **Role:** Toggles post likes via Firestore array modifications.
- **Logic:**
  - Sets up an `onSnapshot` listener on `doc(db, 'posts', postId)` to monitor whether `likes` contains `currentUser.uid`.
  - On click, executes `updateDoc(postRef, { likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) })`.
- **Limitation:** Does not write any notification to the post author's notification feed.

#### `src/components/BookmarkButton.jsx`
- **Location:** `src/components/BookmarkButton.jsx`
- **Role:** Toggles post presence in user's reading list.
- **Logic:**
  - Subscribes via `onSnapshot` to `doc(db, 'users', currentUser.uid)`.
  - Executes `updateDoc(userRef, { readingList: isBookmarked ? arrayRemove(postId) : arrayUnion(postId) })`.

#### `src/components/FollowButton.jsx`
- **Location:** `src/components/FollowButton.jsx`
- **Role:** Follows/unfollows an author.
- **Logic:**
  - Subscribes to `users/${currentUser.uid}` to check if `following` includes `profileUserId`.
  - If `currentUser.uid === profileUserId`, renders `null`.
  - On toggle, fires two independent `updateDoc` calls:
    1. Updates `users/${currentUser.uid}`: `following: arrayUnion/arrayRemove(profileUserId)`
    2. Updates `users/${profileUserId}`: `followers: arrayUnion/arrayRemove(currentUser.uid)`
- **Architectural Risk:** The two operations are not batched or executed within a transaction; a failure in the second call causes desynchronization between follower and following collections. Does not generate follow notifications.

#### `src/components/CommentSection.jsx`
- **Location:** `src/components/CommentSection.jsx`
- **Role:** Displays comments and allows authenticated users to submit new comments.
- **Logic:**
  - Subscribes to subcollection `posts/${postId}/comments` ordered by `createdAt asc`.
  - On submit, adds document to `posts/${postId}/comments` containing `{ text, authorId, authorUsername, authorProfilePic, createdAt: serverTimestamp() }`.
  - If `postAuthorId !== currentUser.uid`, creates a document in `users/${postAuthorId}/notifications` with `{ type: 'comment', fromUser, postId, postTitle, read: false, createdAt: serverTimestamp() }`.
- **Edge Case:** Uses `new Date(comment.createdAt?.toDate()).toLocaleDateString()`. Immediately upon adding a comment, local snapshot latency leaves `comment.createdAt` temporarily null, which outputs "Invalid Date".

#### `src/components/NotificationPanel.jsx`
- **Location:** `src/components/NotificationPanel.jsx`
- **Role:** Displays unread notification count badge and dropdown list of user notifications.
- **Logic:**
  - Subscribes to `users/${currentUser.uid}/notifications` ordered by `createdAt desc`.
  - On opening the panel, executes a `writeBatch` marking all unread notifications with `read: true`.
  - Clicking a notification navigates to `/post/${postId}`.
- **Limitation:** Contains icons and text support for `type === 'like'`, but `LikeButton` never generates like notifications.

#### `src/components/ShareButton.jsx`
- **Location:** `src/components/ShareButton.jsx`
- **Role:** Shares URL via `navigator.share` or copies current URL to clipboard with fallback `alert('Link copied to clipboard!')`.

---

### 4.3 Page Views

#### `src/pages/LandingPage.jsx`
- **Location:** `src/pages/LandingPage.jsx`
- **Role:** Public marketing page showcasing features, interactive background particle effect, and creator story.
- **Logic:** Contains a redirect hook: if `currentUser` is truthy, automatically redirects to `/home`.
- **Defect:** Includes a button `<Link to="/explore">Explore Stories</Link>`. There is no `/explore` route configured in `App.jsx`.

#### `src/pages/HomePage.jsx`
- **Location:** `src/pages/HomePage.jsx`
- **Role:** Main blog feed view with tabs for "Global" and "Following", plus a "Trending Post" sidebar.
- **Logic:**
  - **Global Feed:** Queries `collection(db, 'posts')` where `status == 'published'`. Posts are sorted in JavaScript: `b.publishedAt?.toDate() - a.publishedAt?.toDate()`.
  - **Following Feed:** Fetches `users/${currentUser.uid}`, extracts `following` array, and executes `where('authorId', 'in', followingList)` and `where('status', '==', 'published')`.
  - **Trending Sidebar:** Queries `collection(db, 'posts')` where `status == 'published'`, ordered by `viewCount desc`, limit 1.
  - **Snippet Creation:** Strips HTML by writing to a temporary `div.innerHTML` and reading `textContent`.
- **Risks:**
  - Unsafe HTML rendering via `dangerouslySetInnerHTML={{ __html: topPost.content }}` without sanitization.
  - Runtime crash bug: `post.publishedAt?.toDate().toLocaleDateString()`: if `publishedAt` is undefined, `?.toDate()` returns `undefined`, and `.toLocaleDateString()` triggers a fatal `TypeError`.
  - Firestore `in` query limitation: Fails if `followingList` contains > 30 authors.

#### `src/pages/SinglePostPage.jsx`
- **Location:** `src/pages/SinglePostPage.jsx`
- **Role:** Displays full post content, manages unique session views, renders author spotlight, and lists more posts from author.
- **Logic:**
  - Reads `postId` from URL parameters.
  - Checks `sessionStorage.getItem(postId)`. If absent, increments post `viewCount` atomically via Firestore `increment(1)` and writes flag to `sessionStorage`.
  - Queries `morePosts` with `authorId == postData.authorId` and `status == 'published'`, `limit(4)`.
  - Renders raw HTML using `dangerouslySetInnerHTML={{ __html: post.content }}` without sanitization.

#### `src/pages/PostEditor.jsx`
- **Location:** `src/pages/PostEditor.jsx`
- **Role:** WYSIWYG editor for drafting and publishing articles.
- **Logic:**
  - Integrates TinyMCE React editor (`@tinymce/tinymce-react`).
  - Expects `import.meta.env.VITE_TINYMCE_API_KEY`.
  - Validates ownership if `isEditing` is true (`postData.authorId === currentUser.uid`).
  - Supports status saving as `'published'` or `'draft'`.
  - Automatically initializes `likes: []`, `viewCount: 0`, and timestamps.
- **Defect:** If `editorRef.current` is null, clicking publish or save draft silently does nothing.

#### `src/pages/Dashboard.jsx`
- **Location:** `src/pages/Dashboard.jsx`
- **Role:** Author's administrative dashboard displaying published/draft post statistics, view counts, like counts, and comment totals.
- **Logic:**
  - Subscribes to `posts` where `authorId == currentUser.uid`.
  - For every published post, iterates sequentially in a loop:
    `await getCountFromServer(collection(db, 'posts', post.id, 'comments'))`.
  - Provides a "Post" button to publish drafts (`status: 'published'`).
- **Defects:**
  - **N+1 Performance Bottleneck:** Loops through all published posts executing `getCountFromServer` sequentially on every snapshot trigger.
  - **No Edit Action for Published Posts:** Only draft posts render the `<Link to={'/edit-post/' + post.id}>` edit action. Published posts only display stats and delete.
  - **Orphaned Subcollections:** `deleteDoc(doc(db, 'posts', postId))` deletes the post document but leaves child comments intact in Firestore.

#### `src/pages/CategoryPage.jsx`
- **Location:** `src/pages/CategoryPage.jsx`
- **Role:** Feed of posts tagged with a specific category from URL parameter (`/category/:categoryName`).
- **Logic:** Queries `posts` where `categories array-contains categoryName`.
- **Defects:**
  - Does NOT filter `where('status', '==', 'published')`. Unpublished drafts with matching categories are exposed to readers.
  - Lacks styling; uses raw inline styles unlike the rest of the application.

#### `src/pages/ProfilePage.jsx` & `src/pages/ProfileEditPage.jsx`
- **Location:** `src/pages/ProfilePage.jsx` and `src/pages/ProfileEditPage.jsx`
- **Role:** Author profile view and profile modification form.
- **Logic:**
  - `ProfilePage` displays author header, follower/following counts, bio, location, and published posts grid.
  - `ProfileEditPage` allows editing username, bio, date of birth, location, profile picture URL, and cover photo URL.
  - Synchronizes both `users/${currentUser.uid}` doc and Firebase Auth `updateProfile(currentUser, { displayName, photoURL })`.
- **Defects:**
  - Image upload buttons (`<Camera size={16} />`) have no event handlers; README claims Firebase Storage handles uploads, but form uses raw text inputs for image URLs.
  - Brand name typo: `ShareButton text={'Check out ' + profile.username + '\'s profile on Blogzilla!'}`.

#### `src/pages/ReadingListPage.jsx`
- **Location:** `src/pages/ReadingListPage.jsx`
- **Role:** Displays all posts bookmarked by the user.
- **Logic:**
  - Listens to `users/${currentUser.uid}.readingList`.
  - Queries `posts` where `__name__ in readingListIds`.
- **Defects:**
  - Hard limit of 30 items for Firestore `in` queries. If reading list exceeds 30, query crashes.
  - Uses deprecated `source.unsplash.com` URL for placeholder images, resulting in broken image icons.
  - Does not offer an unbookmark/remove button on the reading list cards.

#### `src/pages/UserSettingsPage.jsx` (Unrouted / Stubbed)
- **Location:** `src/pages/UserSettingsPage.jsx`
- **Role:** Intended multi-tab settings management view (Profile, Account, Notifications, Privacy, Appearance/Dark Mode).
- **Status:** **Unfinished Stub.** The JSX contains tab buttons and "Save" handlers, but all input fields are replaced with comments: `{/* ... Profile fields ... */}`, `{/* ... Account fields ... */}`, etc. The file is unrouted in `App.jsx` and contains an unused variable causing an ESLint error.

#### `src/pages/Login.jsx` & `src/pages/SignUp.jsx`
- **Location:** `src/pages/Login.jsx` and `src/pages/SignUp.jsx`
- **Role:** Authentication screens for Email/Password and Google Popup OAuth.
- **Logic:**
  - `Login.jsx`: Executes `signInWithEmailAndPassword` or `signInWithPopup(auth, provider)`. Ensures user document exists in Firestore.
  - `SignUp.jsx`: Calls `createUserWithEmailAndPassword`, then writes user document to `users/${user.uid}`.
- **Defect:** `SignUp.jsx` does NOT call `updateProfile(user, { displayName: username })`. As a result, `currentUser.displayName` is null until the user manually visits `ProfileEditPage`.

---

## 5. Frontend Architecture

### 5.1 Application Rendering & Routing Hierarchy

```mermaid
graph TD
    Entry["main.jsx"] --> StrictMode["React.StrictMode"]
    StrictMode --> AuthProv["AuthProvider (AuthContext.jsx)"]
    AuthProv --> AppRouter["AppWithRouter (App.jsx)"]
    AppRouter --> BRouter["BrowserRouter"]
    BRouter --> RoutesContainer["Routes"]

    RoutesContainer -->|"/"| LandingPage["LandingPage.jsx"]
    RoutesContainer -->|"/login"| LoginPage["Login.jsx"]
    RoutesContainer -->|"/signup"| SignUpPage["SignUp.jsx"]

    RoutesContainer -->|"Protected Boundary"| ProtRoute["ProtectedRoute.jsx"]
    ProtRoute --> MainLayout["MainLayout.jsx"]
    MainLayout --> Navbar["Navbar.jsx"]
    Navbar --> NotifPanel["NotificationPanel.jsx"]
    Navbar --> NavAvatar["Avatar.jsx"]

    MainLayout --> Outlet["Outlet (Child Views)"]
    Outlet -->|"/home"| HomePage["HomePage.jsx"]
    Outlet -->|"/post/:postId"| SinglePostPage["SinglePostPage.jsx"]
    Outlet -->|"/category/:categoryName"| CategoryPage["CategoryPage.jsx"]
    Outlet -->|"/profile/:userId"| ProfilePage["ProfilePage.jsx"]
    Outlet -->|"/edit-profile"| ProfileEditPage["ProfileEditPage.jsx"]
    Outlet -->|"/edit-post/:postId"| PostEditorEdit["PostEditor.jsx (Edit)"]
    Outlet -->|"/create-post"| PostEditorNew["PostEditor.jsx (Create)"]
    Outlet -->|"/dashboard"| Dashboard["Dashboard.jsx"]
    Outlet -->|"/reading-list"| ReadingListPage["ReadingListPage.jsx"]
```

### 5.2 Component Composition Tree
- **Global Frame:** `MainLayout` hosts `Navbar`, inside of which `NotificationPanel` and `Avatar` are mounted.
- **Feed Elements:** `HomePage` embeds `LikeButton`, `BookmarkButton`, and `Avatar`.
- **Article Elements:** `SinglePostPage` embeds `LikeButton`, `BookmarkButton`, `ShareButton`, `FollowButton`, `CommentSection`, and nested `Avatar` components.
- **Dashboard:** `Dashboard` incorporates inline stat cards, draft publish toggles, and direct routing triggers to `PostEditor`.

### 5.3 State Management Architecture
The application does not use external state libraries like Redux, Zustand, or MobX. State is segregated into:
1. **Global Auth State:** Stored in `AuthContext` via React `useState`, updated by Firebase's `onAuthStateChanged` observer.
2. **Local Component State:** Managed through React `useState` and `useEffect` within individual pages and components.
3. **Database Real-Time Synchronization:** Managed directly via Firestore `onSnapshot` listeners embedded in each component, creating distributed client-side reactive subscriptions.

### 5.4 Styling Strategy
The project currently employs three disparate styling methodologies:
1. **Tailwind CSS 4:** Declared in `src/index.css` and used for general layout scaffolding (`flex`, `grid`, `min-h-screen`, `max-w-7xl`).
2. **Scoped CSS Modules:** Individual `*.module.css` files provide glassmorphic styling, animations, and gradients for buttons, navbar, forms, and cards.
3. **Orphaned Token Sheet:** `src/styles/globals.css` defines over 500 lines of CSS custom properties (tokens for colors, typography, elevations, spacing), but is never imported into any bundle.

---

## 6. Backend & Infrastructure Architecture

```mermaid
graph LR
    ClientApp["React SPA Client"]
    
    subgraph FirebaseBaaS["Firebase Cloud Services"]
        AuthService["Firebase Authentication<br/>(Email/Password & Google OAuth)"]
        FirestoreDB["Cloud Firestore<br/>(NoSQL Document Store)"]
        StorageBucket["Firebase Storage<br/>(Storage Bucket - Unused)"]
        HostingCDN["Firebase Hosting<br/>(Global CDN)"]
    end

    subgraph ExternalAPIs["External Cloud Services"]
        TinyMCECDN["TinyMCE Cloud API<br/>(Editor Assets)"]
    end

    ClientApp -->|"auth tokens / sessions"| AuthService
    ClientApp -->|"direct SDK read/write/listen"| FirestoreDB
    ClientApp -.->|"configured but unintegrated"| StorageBucket
    HostingCDN -->|"serves compiled assets"| ClientApp
    ClientApp -->|"loads editor script"| TinyMCECDN
```

### 6.1 Serverless Architecture
There is no dedicated backend runtime (such as Express, NestJS, FastAPI, or Go). All business logic, permission verification, and data persistence are handled directly from the browser to Firebase services using the modular Firebase SDK.

### 6.2 Firebase Hosting Infrastructure
- Configuration in `firebase.json`:
  ```json
  {
    "hosting": {
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  }
  ```
- All client-side routes are rewritten to `/index.html` to allow React Router to manage the browser history API.
- Project binding in `.firebaserc` maps to `mybloggingapp-c3d04`.

---

## 7. Database Architecture (Cloud Firestore)

The application utilizes Google Cloud Firestore, a document-oriented NoSQL database. Documents are organized into root collections and subcollections.

### 7.1 Entity-Relationship & Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ POSTS : "authors"
    USERS ||--o{ NOTIFICATIONS : "receives (subcollection)"
    POSTS ||--o{ COMMENTS : "contains (subcollection)"
    USERS }o--o{ POSTS : "bookmarks (readingList array)"
    USERS }o--o{ POSTS : "likes (likes array)"
    USERS }o--o{ USERS : "follows (following/followers arrays)"

    USERS {
        string uid PK
        string username
        string email
        string bio
        string location
        string dateOfBirth
        string profilePictureURL
        string coverPhotoURL
        string website
        string[] followers
        string[] following
        string[] readingList
        timestamp createdAt
    }

    POSTS {
        string id PK
        string authorId FK
        string authorUsername
        string authorProfilePic
        string title
        string content
        string[] categories
        string status "draft | published"
        int viewCount
        string[] likes
        timestamp createdAt
        timestamp publishedAt
        timestamp lastUpdatedAt
    }

    COMMENTS {
        string id PK
        string authorId FK
        string authorUsername
        string authorProfilePic
        string text
        timestamp createdAt
    }

    NOTIFICATIONS {
        string id PK
        string type "comment | like"
        string fromUser
        string postId FK
        string postTitle
        boolean read
        timestamp createdAt
    }
```

### 7.2 Detailed Collection Specifications

#### 1. `users` Collection (`/users/{userId}`)
Primary document store for registered users.
- `uid` (`string`): Firebase Auth User UID.
- `username` (`string`): User display name.
- `email` (`string`): Registered email address.
- `bio` (`string`): Short author biography.
- `location` (`string`): Optional geographical location.
- `dateOfBirth` (`string`): Optional birth date (`YYYY-MM-DD`).
- `profilePictureURL` (`string`): Direct URL to avatar image.
- `coverPhotoURL` (`string`): Direct URL to profile header image.
- `website` (`string`): Author external website.
- `followers` (`array of strings`): List of user UIDs following this user.
- `following` (`array of strings`): List of user UIDs this user is following.
- `readingList` (`array of strings`): List of post document IDs bookmarked by this user.
- `createdAt` (`timestamp`): Account registration timestamp.

#### 2. `posts` Collection (`/posts/{postId}`)
Contains blog articles.
- `id` (`string`): Unique auto-generated Firestore document ID.
- `title` (`string`): Post headline.
- `content` (`string`): Raw HTML markup generated by TinyMCE.
- `categories` (`array of strings`): Categorical tags.
- `status` (`string`): Either `'draft'` or `'published'`.
- `authorId` (`string`): UID of the author.
- `authorUsername` (`string`): Denormalized author display name.
- `authorProfilePic` (`string`): Denormalized author avatar URL.
- `viewCount` (`number`): Cumulative article views.
- `likes` (`array of strings`): Array of user UIDs who liked the post.
- `createdAt` (`timestamp`): Document creation timestamp.
- `publishedAt` (`timestamp` or `null`): Publication timestamp.
- `lastUpdatedAt` (`timestamp`): Last modification timestamp.

#### 3. Subcollection `comments` (`/posts/{postId}/comments/{commentId}`)
Child subcollection storing reader responses under a specific post.
- `id` (`string`): Auto-generated comment ID.
- `text` (`string`): Comment body text.
- `authorId` (`string`): UID of the commenter.
- `authorUsername` (`string`): Display name of commenter.
- `authorProfilePic` (`string`): Avatar URL of commenter.
- `createdAt` (`timestamp`): Submission timestamp.

#### 4. Subcollection `notifications` (`/users/{userId}/notifications/{notificationId}`)
User inbox for event alerts.
- `id` (`string`): Auto-generated notification ID.
- `type` (`string`): Event type (`'comment'` or `'like'`).
- `fromUser` (`string`): Username of the actor triggering the notification.
- `postId` (`string`): Associated post ID.
- `postTitle` (`string`): Associated post title.
- `read` (`boolean`): Read flag (`false` indicates unread).
- `createdAt` (`timestamp`): Event creation timestamp.

---

## 8. API Documentation and Communication Flow

Because the project uses Firebase BaaS rather than custom REST or GraphQL endpoints, communication consists of Firebase client SDK protocol calls over WebSockets / HTTPS.

### 8.1 Firebase Operation Directory

| Method | Target Resource | File Reference | Trigger / Description |
|---|---|---|---|
| `signInWithEmailAndPassword` | Auth Service | `src/pages/Login.jsx` | Authenticates existing user with email/password. |
| `createUserWithEmailAndPassword` | Auth Service | `src/pages/SignUp.jsx` | Creates authentication credentials. |
| `signInWithPopup` | Auth Service | `src/pages/Login.jsx`, `SignUp.jsx` | Performs Google OAuth authentication. |
| `signOut` | Auth Service | `src/context/AuthContext.jsx` | Invalidates active user session. |
| `updateProfile` | Auth Service | `src/pages/ProfileEditPage.jsx` | Updates displayName and photoURL in Auth token. |
| `onSnapshot` | `/posts` (Global) | `src/pages/HomePage.jsx` | Listens to all published posts for main feed. |
| `onSnapshot` | `/posts` (Trending) | `src/pages/HomePage.jsx` | Queries highest `viewCount` published post. |
| `onSnapshot` | `/posts` (Author) | `src/pages/Dashboard.jsx` | Listens to author's posts by `authorId`. |
| `onSnapshot` | `/posts/{id}` | `src/components/LikeButton.jsx` | Listens to like updates for a single post. |
| `onSnapshot` | `/users/{id}` | `src/components/BookmarkButton.jsx` | Listens to user's reading list array. |
| `onSnapshot` | `/users/{id}` | `src/components/FollowButton.jsx` | Listens to user's following list array. |
| `onSnapshot` | `/posts/{id}/comments` | `src/components/CommentSection.jsx` | Subscribes to comment feed for article. |
| `onSnapshot` | `/users/{id}/notifications` | `src/components/NotificationPanel.jsx` | Subscribes to real-time notifications for user. |
| `getDoc` | `/posts/{id}` | `src/pages/SinglePostPage.jsx`, `PostEditor.jsx` | Reads single article record on load. |
| `getDoc` | `/users/{id}` | `src/pages/ProfilePage.jsx`, `ProfileEditPage.jsx` | Reads user profile metadata. |
| `addDoc` | `/posts` | `src/pages/PostEditor.jsx` | Inserts new post document. |
| `updateDoc` | `/posts/{id}` | `src/pages/PostEditor.jsx`, `Dashboard.jsx` | Updates post metadata, content, status. |
| `updateDoc` (increment) | `/posts/{id}` | `src/pages/SinglePostPage.jsx` | Increments `viewCount` via `increment(1)`. |
| `updateDoc` (arrayUnion/Remove) | `/posts/{id}` | `src/components/LikeButton.jsx` | Appends/removes UID in `likes` array. |
| `updateDoc` (arrayUnion/Remove) | `/users/{id}` | `src/components/BookmarkButton.jsx` | Appends/removes post ID in `readingList`. |
| `updateDoc` (arrayUnion/Remove) | `/users/{id}` | `src/components/FollowButton.jsx` | Updates `following` and `followers` arrays. |
| `deleteDoc` | `/posts/{id}` | `src/pages/Dashboard.jsx` | Deletes post document. |
| `getCountFromServer` | `/posts/{id}/comments` | `src/pages/Dashboard.jsx` | Aggregate query counting comments per post. |
| `writeBatch` | `/users/{id}/notifications` | `src/components/NotificationPanel.jsx` | Commits batch update marking notifications read. |

---

## 9. Authentication and Authorization

### 9.1 Authentication Flow
1. **Providers Supported:**
   - Email and Password (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`).
   - Google Sign-In (`GoogleAuthProvider`, `signInWithPopup`).
2. **Session Persistence:** Managed internally by Firebase Auth client library in browser IndexedDB/LocalStorage.
3. **Context Synchronization:** `AuthContext.jsx` registers `onAuthStateChanged(auth, callback)`. Upon state updates, it populates `currentUser` and toggles `loading: false`.

### 9.2 Authorization Architecture
1. **Client-Side Route Guard (`ProtectedRoute.jsx`):**
   - Intercepts navigation to `/home`, `/post/:id`, `/dashboard`, etc.
   - If `currentUser` is null, returns `<Navigate to="/login" />`.
2. **Content Ownership Verification:**
   - `PostEditor.jsx` checks `postData.authorId === currentUser.uid` before permitting updates. If mismatched, returns an error message.
   - `ProfilePage.jsx` checks `currentUser.uid === userId` to display the "Edit Profile" button vs the "Follow" button.
3. **Backend Security Rules (Firestore Security Rules):**
   - **CRITICAL OBSERVATION:** There is **NO `firestore.rules` or `storage.rules` file in the codebase**.
   - If Firebase is running in "Test Mode" (open read/write for 30 days) or lacks rigorous server-side security rules, any client can read or overwrite any document in `users` or `posts` regardless of client-side validation.

---

## 10. Important Business Logic

### 10.1 Post Creation and Publication State Machine
- When creating a post, `status` can be assigned as `'published'` or `'draft'`.
- If `'published'`, `publishedAt` is assigned `serverTimestamp()`.
- If `'draft'`, `publishedAt` is set to `null`.
- In `Dashboard.jsx`, an author can promote a draft to published with a single click, which sets `status = 'published'` and writes `publishedAt = serverTimestamp()`.

### 10.2 View Count Deduplication
In `SinglePostPage.jsx`, view tracking is deduplicated at the browser session level:
```javascript
const viewed = sessionStorage.getItem(postId);
if (!viewed) {
  await updateDoc(postRef, { viewCount: increment(1) });
  sessionStorage.setItem(postId, 'true');
}
```
If the user navigates between posts within the same session, re-visiting an article does not re-increment `viewCount`.

### 10.3 Avatar Color Synthesis Algorithm
When a user has no `profilePictureURL`, `Avatar.jsx` computes an avatar background color deterministically from their name:
```javascript
const generateColor = (str) => {
  if (!str) return '#cccccc';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};
```
This ensures consistent user avatar colors across comments, navigation, and author cards without storing color values in the database.

---

## 11. End-to-End Application Workflows

### 11.1 Post Creation and Feed Propagation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Author
    participant PostEditor as PostEditor.jsx
    participant Firestore as Cloud Firestore
    participant HomePage as HomePage.jsx (Readers)

    Author->>PostEditor: Enters title, categories, and TinyMCE content
    Author->>PostEditor: Clicks "Publish"
    PostEditor->>Firestore: addDoc(collection('posts'), postData)
    Firestore-->>PostEditor: Document created (postId)
    PostEditor->>Author: navigate('/dashboard')
    
    par Real-Time Listener Propagation
        Firestore->>HomePage: onSnapshot triggered (new published post)
        HomePage->>HomePage: Sorts posts chronologically
        HomePage-->>Author: Displays new article in Global Feed
    end
```

### 11.2 Commenting and Notification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Reader
    participant CommentSection as CommentSection.jsx
    participant Firestore as Cloud Firestore
    participant AuthorPanel as NotificationPanel.jsx (Author)
    actor Author

    Reader->>CommentSection: Types comment & submits
    CommentSection->>Firestore: addDoc('posts/{id}/comments', commentData)
    CommentSection->>Firestore: addDoc('users/{authorId}/notifications', notifData)
    
    Firestore->>AuthorPanel: onSnapshot triggers on 'notifications'
    AuthorPanel-->>Author: Badge count increments
    Author->>AuthorPanel: Clicks bell icon
    AuthorPanel->>Firestore: writeBatch().update({ read: true })
    AuthorPanel-->>Author: Displays unread comment alert
```

---

## 12. Component and Module Dependencies

```mermaid
graph TD
    subgraph Context & Config
        FBConfig["firebase/config.js"]
        AuthContext["context/AuthContext.jsx"]
        FBConfig --> AuthContext
    end

    subgraph Utilities & Hooks
        ClickOutside["hooks/useClickOutside.js"]
    end

    subgraph Components
        AvatarComp["components/Avatar.jsx"]
        LikeBtn["components/LikeButton.jsx"]
        BookBtn["components/BookmarkButton.jsx"]
        ShareBtn["components/ShareButton.jsx"]
        FollowBtn["components/FollowButton.jsx"]
        CommentSec["components/CommentSection.jsx"]
        NotifPan["components/NotificationPanel.jsx"]
        ProtRoute["components/ProtectedRoute.jsx"]
        MainLayoutComp["components/MainLayout.jsx"]
        NavbarComp["components/Navbar.jsx"]

        FBConfig --> LikeBtn
        FBConfig --> BookBtn
        FBConfig --> FollowBtn
        FBConfig --> CommentSec
        FBConfig --> NotifPan

        AuthContext --> LikeBtn
        AuthContext --> BookBtn
        AuthContext --> FollowBtn
        AuthContext --> CommentSec
        AuthContext --> NotifPan
        AuthContext --> ProtRoute
        AuthContext --> NavbarComp

        ClickOutside --> NavbarComp
        ClickOutside --> NotifPan

        AvatarComp --> CommentSec
        AvatarComp --> NavbarComp

        NavbarComp --> MainLayoutComp
        ProtRoute --> MainLayoutComp
    end

    subgraph Pages
        HomePageP["pages/HomePage.jsx"]
        SinglePostP["pages/SinglePostPage.jsx"]
        DashboardP["pages/Dashboard.jsx"]
        ProfileP["pages/ProfilePage.jsx"]
        ProfileEditP["pages/ProfileEditPage.jsx"]
        PostEditorP["pages/PostEditor.jsx"]
        ReadingListP["pages/ReadingListPage.jsx"]

        LikeBtn --> HomePageP
        BookBtn --> HomePageP
        AvatarComp --> HomePageP

        LikeBtn --> SinglePostP
        BookBtn --> SinglePostP
        ShareBtn --> SinglePostP
        FollowBtn --> SinglePostP
        CommentSec --> SinglePostP

        FollowBtn --> ProfileP
        ShareBtn --> ProfileP
        AvatarComp --> ProfileP
    end
```

---

## 13. Application Setup and Execution

### 13.1 Local Development Commands
| Step / Action | Command Line | Description |
|---|---|---|
| Dependency Installation | `npm install` | Installs dependencies into `node_modules` according to `package-lock.json`. |
| Development Server | `npm run dev` | Boots local Vite development server with HMR (typically at `http://localhost:5173`). |
| Production Build | `npm run build` | Compiles and tree-shakes assets into `./dist`. |
| Local Build Preview | `npm run preview` | Spins up local server previewing output in `./dist`. |
| Static Linting | `npm run lint` | Runs ESLint 9 across all JS/JSX files. |

### 13.2 Environment Variables Requirement
The code expects environment variables prefixed with `VITE_` (Vite client convention):
```env
# Required for TinyMCE rich text editor (PostEditor.jsx)
VITE_TINYMCE_API_KEY=your_tinymce_api_key_here

# Used in firebase/config.js line 12
VITE_APP_ID=your_firebase_app_id_here
```
> [!WARNING]
> While `README.md` documents variables like `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc., the source code in `src/firebase/config.js` has these keys hardcoded, referencing only `import.meta.env.VITE_APP_ID`. This discrepancy is an architectural defect.

---

## 14. Testing Infrastructure

### 14.1 Current Testing State
- **Unit Testing Framework:** **None.** (No Vitest, Jest, or Mocha installed).
- **Component Testing:** **None.** (No `@testing-library/react` installed).
- **End-to-End (E2E) Testing:** **None.** (No Playwright or Cypress configured).
- **Test Scripts:** `package.json` contains no `"test"` script.
- **Verification Performed:** Executed `npm run lint` and `npm run build`. Build succeeds; lint fails with 2 errors and 1 warning.

---

## 15. Existing Technical Debt and Potential Issues

Issues discovered during the inspection are categorized below:

### 15.1 Critical Severity (Functional Failure, Security Risk, or Crash Bug)

1. **Date Null-Safety Crash on Feeds & Profiles**
   - **Files:** `src/pages/HomePage.jsx` (lines 92, 130), `src/pages/ProfilePage.jsx` (line 97).
   - **Issue:** Code executes `post.publishedAt?.toDate().toLocaleDateString()`. If `post.publishedAt` is `null` or `undefined` (common when a post is newly submitted with `serverTimestamp()` pending or before initial publish), `post.publishedAt?.toDate()` evaluates to `undefined`. Invoking `.toLocaleDateString()` on `undefined` throws an unhandled `TypeError: Cannot read properties of undefined (reading 'toLocaleDateString')`, crashing the entire React render tree.
   
2. **Missing Input Sanitization / Stored XSS Vulnerability**
   - **Files:** `src/pages/HomePage.jsx` (line 134), `src/pages/SinglePostPage.jsx` (line 76).
   - **Issue:** Post content generated by TinyMCE is rendered via `<div dangerouslySetInnerHTML={{ __html: post.content }} />` without sanitization. If an author inserts malicious `<script>` tags, iframe embeds, or `onerror` attributes, arbitrary JavaScript executes in readers' browser sessions. No sanitization library (e.g., `DOMPurify`) is present.

3. **Missing Environment Configuration & Broken Firebase App ID**
   - **Files:** `src/firebase/config.js`, root directory.
   - **Issue:** No `.env` file exists. Firebase config has hardcoded credentials except for `appId: import.meta.env.VITE_APP_ID`. Because `VITE_APP_ID` is undefined, Firebase initializes without an `appId`, which can cause telemetry or auth handshake failures.

4. **Missing Firestore Security Rules**
   - **Issue:** No `firestore.rules` file is tracked in the repository. Client-side applications directly invoking `addDoc`, `updateDoc`, and `deleteDoc` without server-side rules are vulnerable to unauthorized record modification or deletion.

5. **Follow/Unfollow Desynchronization**
   - **File:** `src/components/FollowButton.jsx` (lines 29-35).
   - **Issue:** Modifies `currentUser` following array and `profileUser` followers array in two sequential, unbatched `updateDoc` calls. A network drop, permission rejection, or tab close between calls permanently corrupts follower counts.

---

### 15.2 High Severity (Architectural Concerns, Limits & Incomplete Features)

6. **Firestore Query Limit Failure on Bookmarks and Follows**
   - **Files:** `src/pages/ReadingListPage.jsx` (line 25), `src/pages/HomePage.jsx` (line 45).
   - **Issue:** Queries use `where('__name__', 'in', readingListIds)` and `where('authorId', 'in', followingList)`. Firestore limits `in` queries to a maximum of 30 values. If a user follows > 30 creators or saves > 30 articles, Firestore throws a client error, preventing the feed or reading list from loading.

7. **Incomplete / Stubbed Settings Page**
   - **File:** `src/pages/UserSettingsPage.jsx`.
   - **Issue:** The file contains UI scaffolding, tabs, and update functions, but the form bodies contain comment placeholders (`{/* ... Profile fields ... */}`). Furthermore, it is not imported or linked in `App.jsx`.

8. **N+1 Sequential Network Calls in Dashboard**
   - **File:** `src/pages/Dashboard.jsx` (lines 29-37).
   - **Issue:** Within the `onSnapshot` callback for posts, the dashboard loops through every published post and executes `await getCountFromServer(commentsCol)` sequentially. For an author with 30 posts, this triggers 30 sequential network requests on every snapshot change.

9. **Incomplete Notification Implementation**
   - **Files:** `src/components/LikeButton.jsx`, `src/components/FollowButton.jsx`, `src/components/NotificationPanel.jsx`.
   - **Issue:** `NotificationPanel` renders icons and copy for like notifications, but `LikeButton.jsx` and `FollowButton.jsx` never insert notification documents into `users/{userId}/notifications`. Notifications are only created on comments in `CommentSection.jsx`.

10. **Unsplash Deprecation Leading to Broken Images**
    - **File:** `src/pages/ReadingListPage.jsx` (line 51).
    - **Issue:** Uses `https://source.unsplash.com/random/240x240?sig=...`. Unsplash has sunset `source.unsplash.com`, causing these image requests to fail.

11. **Published Posts Cannot Be Edited From Dashboard**
    - **File:** `src/pages/Dashboard.jsx` (lines 101-118).
    - **Issue:** In the dashboard table, only draft posts display an "Edit" button. Published posts only display view/like/comment stats and a delete button, preventing users from editing published articles through the UI.

12. **Missing Post Draft Filtering in Category Feeds**
    - **File:** `src/pages/CategoryPage.jsx` (line 17).
    - **Issue:** Queries `where('categories', 'array-contains', categoryName)` without checking `where('status', '==', 'published')`. Unpublished drafts are exposed to readers browsing category feeds.

13. **Orphaned Subcollections on Deletion**
    - **File:** `src/pages/Dashboard.jsx` (line 45).
    - **Issue:** When a post is deleted via `deleteDoc(doc(db, 'posts', postId))`, Firestore leaves the `posts/{postId}/comments` subcollection orphaned in the database.

14. **Dead Duplicate Component**
    - **File:** `src/components/components/Avatar.jsx`.
    - **Issue:** Stray nested folder containing an outdated copy of `Avatar.jsx` that fails to resolve its CSS module.

---

### 15.3 Medium Severity (Maintainability & Usability)

15. **ESLint Errors Breaking CI/CD**
    - **Issue:** `npm run lint` exits with code 1 due to fast refresh violations in `AuthContext.jsx` and unused variables/missing dependencies in `UserSettingsPage.jsx`.
16. **Dead / Orphaned Styling Assets**
    - **Files:** `src/styles/globals.css` (551 lines of unused design tokens), `src/App.css` (Vite starter CSS). Neither is imported anywhere.
17. **Configuration File Locations**
    - **Files:** `src/tailwind.config.js`, `src/postcss.config.js`. Placed in `src/` rather than the workspace root where standard Vite tooling discovers them.
18. **Branding Inconsistencies**
    - Multiple names in use: "Burst" in Navbar/Landing, "Blogzilla" in ProfilePage share text, and "my-blog-app" in `package.json`.
19. **Broken Link on Landing Page**
    - **File:** `src/pages/LandingPage.jsx` (line 78) links to `/explore`, which does not exist in `App.jsx`.
20. **Large Un-split JavaScript Bundle**
    - Production build outputs a single 792 kB minified bundle (`index-D41030MI.js`). No dynamic imports or lazy routing (`React.lazy`) are used.
21. **User Display Name Not Initialized on Registration**
    - **File:** `src/pages/SignUp.jsx`. Does not call `updateProfile(user, { displayName })` upon registration, leaving `displayName` null until manually updated on `ProfileEditPage`.

---

### 15.4 Low Severity (Minor Cleanup)

22. **Duplicate `index.html` in `public/`**
    - `public/index.html` contains default Firebase Hosting HTML that could conflict with Vite root `index.html`.
23. **Missing Catch-All 404 Route**
    - Undefined paths result in a blank screen inside `App.jsx` instead of a custom "Page Not Found" view.

---

## 16. Important Considerations for Future Development

When modifying or extending this application in subsequent phases, adhere to the following architectural guidelines:

1. **Preserve Firebase Modular SDK Conventions:** Always use functional imports (`doc`, `getDoc`, `updateDoc`, `query`, `where`) from `firebase/firestore` rather than legacy v8 chaining (`db.collection().doc()`).
2. **Mandatory Date Null-Checks:** Never call `.toDate()` or `.toLocaleDateString()` directly on Firestore timestamps without verifying that the timestamp is defined and valid (e.g., `post.publishedAt ? post.publishedAt.toDate().toLocaleDateString() : 'Draft'`).
3. **Composite Index Requirements:** When adding compound queries (e.g., combining `where('status', '==', 'published')` with `orderBy('publishedAt', 'desc')`), verify that the corresponding composite index is defined in Firebase Console; otherwise Firestore queries will throw index errors.
4. **Batching Multi-Document Updates:** All operations affecting multiple documents simultaneously (such as following/unfollowing or post deletion) must use `writeBatch(db)` or Firestore transactions (`runTransaction`) to guarantee atomic consistency.
5. **Sanitize HTML Before Rendering:** Integrate a sanitizer like `dompurify` prior to using `dangerouslySetInnerHTML`.
6. **Code-Split Route Tree:** Use `React.lazy()` and `<Suspense>` for route components to break down the monolithic 792 kB bundle.

---

## 17. Architecture Verification Summary

- **Code Inspection:** All 64 project files systematically cataloged, read, and cross-referenced.
- **Build Status:** Verified working (`vite build` completes successfully in 10.07s).
- **Lint Status:** Verified failing with 2 errors and 1 warning (`npm run lint` fails).
- **Source State:** Intact. No files were modified, moved, or deleted during this analysis.

