import { Clerk } from '@clerk/clerk-js'
import { dark } from '@clerk/themes'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, onValue, serverTimestamp, set, remove, get } from 'firebase/database'

const appDiv = document.getElementById('app');
appDiv.innerHTML = `
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #09090b; color: white; font-family: sans-serif;">
    <h2>Loading SocialFeed...</h2>
  </div>
`;

try {
  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDpCAXfhldRc1nCZDWlWNRbcMFjqAh8uPc",
    authDomain: "cloud-db-studio.firebaseapp.com",
    databaseURL: "https://cloud-db-studio-default-rtdb.firebaseio.com",
    projectId: "cloud-db-studio",
    storageBucket: "cloud-db-studio.firebasestorage.app",
    messagingSenderId: "343326148662",
    appId: "1:343326148662:web:987738ccc8f9d6a8253097"
  }

  const app = initializeApp(firebaseConfig)
  const db = getDatabase(app)

  // Clerk Initialization
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('Missing Publishable Key: Add your VITE_CLERK_PUBLISHABLE_KEY to the .env file')
  }

  const clerkDomain = atob(publishableKey.split('_')[2]).slice(0, -1)

  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Clerk UI bundle. Check your internet connection.'))
    document.head.appendChild(script)
  })

  const clerk = new Clerk(publishableKey)

  // Using Clerk's official dark theme for perfect contrast
  await clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    appearance: {
      baseTheme: dark,
      variables: {
        colorPrimary: '#3b82f6',
        borderRadius: '12px'
      }
    }
  })

  if (clerk.isSignedIn) {
    const { id, firstName, fullName, imageUrl } = clerk.user;

    const style = document.createElement('style');
    style.innerHTML = `
      body { margin: 0; background: #09090b; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; }
      .panel { background: #18181b; border: 1px solid #27272a; border-radius: 12px; }
      .app-container { max-width: 680px; margin: 0 auto; padding: 2rem 1rem; }
      .header-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; margin-bottom: 2rem; }
      .brand-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #ffffff; }
      
      .compose-card { padding: 1.5rem; margin-bottom: 2rem; }
      .compose-row { display: flex; gap: 1rem; align-items: flex-start; }
      .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #27272a; }
      .post-input { flex: 1; background: transparent; border: none; color: #ffffff; font-size: 1rem; padding: 0.5rem 0; outline: none; resize: none; min-height: 50px; font-family: inherit; }
      .post-input::placeholder { color: #71717a; }
      .compose-actions { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #27272a; margin-top: 0.5rem; }
      .btn-primary { background: #3b82f6; color: #ffffff; border: none; padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
      .btn-primary:hover { background: #2563eb; }

      .feed-stream { display: flex; flex-direction: column; gap: 1.5rem; }
      .post-card { padding: 1.5rem; }
      .post-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
      .post-author-info { display: flex; align-items: center; gap: 0.75rem; }
      .post-meta { display: flex; flex-direction: column; }
      .post-author { font-weight: 600; font-size: 0.95rem; color: #ffffff; }
      .post-time { font-size: 0.8rem; color: #71717a; }
      .post-content { font-size: 1rem; line-height: 1.5; color: #e4e4e7; word-wrap: break-word; margin-bottom: 1.25rem; }
      
      .action-bar { display: flex; gap: 1.5rem; padding-top: 1rem; border-top: 1px solid #27272a; }
      .action-btn { display: flex; align-items: center; gap: 0.4rem; background: transparent; border: none; color: #a1a1aa; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: color 0.2s; padding: 0.25rem; }
      .action-btn:hover { color: #ffffff; }
      .action-btn.liked { color: #ef4444; }
      .action-btn.saved { color: #3b82f6; }
      .action-btn.delete-btn:hover { color: #ef4444; }

      .comments-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #27272a; display: none; }
      .comment-item { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
      .comment-avatar { width: 32px; height: 32px; }
      .comment-bubble { background: #27272a; padding: 0.75rem 1rem; border-radius: 8px; flex: 1; }
      .comment-author { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.2rem; color: #ffffff; }
      .comment-text { font-size: 0.95rem; color: #d4d4d8; line-height: 1.4; }
      .comment-input-row { display: flex; gap: 0.75rem; align-items: center; margin-top: 1rem; }
      .comment-input { flex: 1; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; padding: 0.6rem 1rem; border-radius: 8px; outline: none; font-size: 0.9rem; }
      .comment-input:focus { border-color: #3b82f6; }
    `;
    document.head.appendChild(style);

    appDiv.innerHTML = `
      <div class="app-container">
        <nav class="panel header-nav">
          <h1 class="brand-title">SocialFeed</h1>
          <div id="user-button"></div>
        </nav>
        <main>
          <div class="panel compose-card">
            <div class="compose-row">
              <img src="${imageUrl}" class="avatar" alt="Profile">
              <textarea id="postText" class="post-input" placeholder="What's on your mind, ${firstName || 'there'}?"></textarea>
            </div>
            <div class="compose-actions">
              <button id="postBtn" class="btn-primary">Post</button>
            </div>
          </div>
          <div id="feedStream" class="feed-stream"></div>
        </main>
      </div>
    `;

    clerk.mountUserButton(document.getElementById('user-button'));

    const postsRef = ref(db, 'clerk/posts');
    const savedRef = ref(db, `clerk/saved/${id}`);
    
    document.getElementById('postBtn').addEventListener('click', () => {
      const postText = document.getElementById('postText');
      const content = postText.value.trim();
      if (!content) return;
      push(postsRef, {
        authorId: id,
        authorName: fullName || firstName || 'Anonymous',
        authorImage: imageUrl,
        content: content,
        timestamp: serverTimestamp()
      });
      postText.value = '';
    });

    document.getElementById('feedStream').addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      
      const postId = target.dataset.id;

      if (target.classList.contains('delete-btn')) {
        if(confirm('Are you sure you want to delete this post?')) {
          remove(ref(db, `clerk/posts/${postId}`));
        }
      }
      
      if (target.classList.contains('like-btn')) {
        const likeRef = ref(db, `clerk/posts/${postId}/likes/${id}`);
        const snap = await get(likeRef);
        snap.exists() ? remove(likeRef) : set(likeRef, true);
      }
      
      if (target.classList.contains('save-btn')) {
        const itemSaveRef = ref(db, `clerk/saved/${id}/${postId}`);
        const snap = await get(itemSaveRef);
        snap.exists() ? remove(itemSaveRef) : set(itemSaveRef, true);
      }
      
      if (target.classList.contains('comment-toggle-btn')) {
        const section = document.getElementById(`comments-${postId}`);
        section.style.display = section.style.display === 'none' || !section.style.display ? 'block' : 'none';
      }
      
      if (target.classList.contains('comment-submit-btn')) {
        const input = document.getElementById(`comment-input-${postId}`);
        if (input && input.value.trim()) {
          push(ref(db, `clerk/posts/${postId}/comments`), {
            authorId: id,
            authorName: fullName || firstName || 'Anonymous',
            authorImage: imageUrl,
            text: input.value.trim(),
            timestamp: serverTimestamp()
          });
          input.value = '';
        }
      }
    });

    let currentSavedPosts = {};
    let currentPosts = {};

    onValue(savedRef, (snap) => {
      currentSavedPosts = snap.val() || {};
      renderFeed();
    });

    onValue(postsRef, (snap) => {
      currentPosts = snap.val() || {};
      renderFeed();
    });

    function renderFeed() {
      const feedStream = document.getElementById('feedStream');
      
      if (Object.keys(currentPosts).length === 0) {
        feedStream.innerHTML = '<p style="text-align: center; color: #71717a; margin-top: 2rem;">No posts yet. Be the first to break the silence.</p>';
        return;
      }

      const posts = Object.entries(currentPosts)
        .map(([key, val]) => ({ id: key, ...val }))
        .sort((a, b) => (b.timestamp || Date.now()) - (a.timestamp || Date.now()));

      feedStream.innerHTML = posts.map(post => {
        const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Just now';
        const likesCount = post.likes ? Object.keys(post.likes).length : 0;
        const isLiked = post.likes && post.likes[id];
        const isSaved = currentSavedPosts[post.id];
        const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
        
        let commentsHTML = '';
        if (post.comments) {
          commentsHTML = Object.values(post.comments)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(c => `
              <div class="comment-item">
                <img src="${c.authorImage}" class="avatar comment-avatar">
                <div class="comment-bubble">
                  <div class="comment-author">${c.authorName}</div>
                  <div class="comment-text">${c.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                </div>
              </div>
            `).join('');
        }

        const deleteBtnHTML = post.authorId === id ? `
          <button class="action-btn delete-btn" data-id="${post.id}" title="Delete Post">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        ` : '';

        return `
          <div class="panel post-card">
            <div class="post-header">
              <div class="post-author-info">
                <img src="${post.authorImage}" class="avatar" alt="${post.authorName}">
                <div class="post-meta">
                  <span class="post-author">${post.authorName}</span>
                  <span class="post-time">${dateStr}</span>
                </div>
              </div>
              ${deleteBtnHTML}
            </div>
            <div class="post-content">${post.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            
            <div class="action-bar">
              <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${post.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                ${likesCount > 0 ? likesCount : 'Like'}
              </button>
              <button class="action-btn comment-toggle-btn" data-id="${post.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                ${commentsCount > 0 ? commentsCount : 'Comment'}
              </button>
              <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" data-id="${post.id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                Save
              </button>
            </div>

            <div id="comments-${post.id}" class="comments-section">
              ${commentsHTML}
              <div class="comment-input-row">
                <img src="${imageUrl}" class="avatar comment-avatar">
                <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="Write a comment...">
                <button class="btn-primary comment-submit-btn" data-id="${post.id}">Reply</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

  } else {
    document.body.style.margin = "0";
    document.body.style.background = "#09090b";
    
    appDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh;">
        <div id="sign-in"></div>
      </div>
    `;
    clerk.mountSignIn(document.getElementById('sign-in'));
  }

} catch (error) {
  appDiv.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #09090b; color: #ef4444; padding: 2rem; text-align: center; font-family: monospace;">
      <h2 style="margin-bottom: 1rem;">Application Crashed</h2>
      <div style="background: rgba(239, 68, 68, 0.1); padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
        ${error.message}
      </div>
      <p style="color: #a1a1aa; margin-top: 2rem; font-family: sans-serif;">Ensure you ran <strong>npm install @clerk/themes</strong>.</p>
    </div>
  `;
  console.error(error);
}