// Auto-discover markdown posts in `posts/`
// Strategy:
// 1) Try GitHub API to list files in the posts directory (works for public repo).
// 2) If that fails, fall back to `posts/index.json` if present (for local previews).
// 3) For each markdown file, fetch content (download_url or local path), parse optional YAML frontmatter
//    and derive metadata (title, category, excerpt, date, readTime).

const GITHUB_API_DIR = 'https://api.github.com/repos/foxen328/pomodoro-timer-8bit/contents/posts?ref=main';
const RAW_BASE = 'https://raw.githubusercontent.com/foxen328/pomodoro-timer-8bit/main/posts/';
const LOCAL_INDEX = 'posts/index.json';

let postsIndex = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    postsIndex = await loadPosts();
  } catch (err) {
    console.error('Failed to load posts:', err);
    postsIndex = [];
  }

  renderBlogPosts();
  setupFilterButtons();
  setupDarkMode();
  setupSmoothScroll();
});

async function loadPosts() {
  // Try GitHub API directory listing first (public repos allow this without auth)
  try {
    const dirRes = await fetch(GITHUB_API_DIR);
    if (dirRes.ok) {
      const items = await dirRes.json();
      const mdFiles = items.filter(i => i.type === 'file' && i.name.toLowerCase().endsWith('.md'));
      const posts = [];
      for (const item of mdFiles) {
        try {
          const textRes = await fetch(item.download_url);
          if (!textRes.ok) continue;
          const text = await textRes.text();
          const { meta, content } = parseFrontmatter(text);
          const title = meta.title || extractTitle(content) || item.name.replace(/\.md$/i, '');
          const category = (meta.category || (meta.tags && meta.tags[0]) || 'uncategorized').toLowerCase();
          const excerpt = meta.excerpt || extractExcerpt(content);
          const date = meta.date || '';
          const readTime = estimateReadTime(content);
          posts.push({ id: null, file: item.name, title, category, excerpt, date, readTime, url: item.download_url });
        } catch (e) {
          console.warn('Failed to fetch or parse', item.name, e);
        }
      }
      // Sort by date descending if available, else by filename
      posts.sort((a,b) => {
        if (a.date && b.date) return new Date(b.date) - new Date(a.date);
        return a.file.localeCompare(b.file);
      });
      // Assign incremental ids for local usage
      posts.forEach((p,i) => p.id = i+1);
      return posts;
    }
    throw new Error('GitHub API directory not available');
  } catch (err) {
    // Fallback to local index.json (useful for local file previews)
    try {
      const res = await fetch(LOCAL_INDEX);
      if (!res.ok) throw new Error('Local index not found');
      const json = await res.json();
      // Map entries to include url for local fetch
      return (json.posts || []).map(p => ({ ...p, url: 'posts/' + p.file }));
    } catch (err2) {
      throw new Error('No posts available');
    }
  }
}

function renderBlogPosts(filter = currentFilter) {
  const blogGrid = document.getElementById('blog-posts');
  const filtered = filter === 'all' ? postsIndex : postsIndex.filter(p => p.category === filter);

  if (!blogGrid) return;

  blogGrid.innerHTML = filtered.map(post => `
    <article class="blog-card" data-url="${post.url || ''}" data-file="${post.file}" data-id="${post.id}">
      <div class="blog-card-image"></div>
      <div class="blog-card-content">
        <span class="blog-card-category">${post.category}</span>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-excerpt">${post.excerpt}</p>
        <div class="blog-card-meta">
          <span>${post.date || ''}</span>
          <span>${post.readTime || ''}</span>
        </div>
      </div>
    </article>
  `).join('');

  // Attach click handlers to open full post
  document.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('click', async () => {
      const url = card.getAttribute('data-url') || ('posts/' + card.getAttribute('data-file'));
      if (!url) return;
      await openPostUrl(url);
    });
  });
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.getAttribute('data-filter');
      renderBlogPosts(currentFilter);
    });
  });
}

function setupDarkMode() {
  const toggleButton = document.getElementById('toggle-dark-mode');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (toggleButton) toggleButton.textContent = '☀️';
  }
  if (!toggleButton) return;
  toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      toggleButton.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    } else {
      toggleButton.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    }
  });
}

function setupSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

async function openPostUrl(url) {
  const articleSection = document.createElement('section');
  articleSection.className = 'container';

  // Show a loading state
  const blogSection = document.getElementById('blog');
  const prevDisplay = blogSection.style.display;
  blogSection.style.display = 'none';

  const articleWrapper = document.createElement('div');
  articleWrapper.className = 'cv-content';
  articleWrapper.innerHTML = `<p>Loading post…</p>`;
  articleSection.appendChild(articleWrapper);
  document.body.insertBefore(articleSection, document.querySelector('.footer'));

  let md = '';
  try {
    const res = await fetch(url);
    if (res.ok) md = await res.text();
    else throw new Error('Fetch failed');
  } catch (err) {
    md = '# Post not found\n\nCould not load the requested post.';
  }

  // Render markdown using marked (loaded from CDN)
  let html = '';
  if (typeof marked !== 'undefined') html = marked.parse(md);
  else html = '<pre>' + escapeHtml(md) + '</pre>';

  articleWrapper.innerHTML = `
    <div style="margin: 2rem 0;">
      <button id="back-to-list" class="filter-btn">← Back</button>
    </div>
    <article class="blog-article">${html}</article>
  `;

  document.getElementById('back-to-list').addEventListener('click', () => {
    articleSection.remove();
    blogSection.style.display = prevDisplay || '';
    // ensure blog posts re-render to reattach handlers
    renderBlogPosts(currentFilter);
  });
}

// --- helpers: frontmatter parsing and simple metadata extraction ---
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { meta: {}, content: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, content: text };
  const fm = text.slice(3, end + 1).trim();
  const rest = text.slice(end + 4).trim();
  const meta = {};
  fm.split(/\n+/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // simple list handling for tags: a, b, c
    if (val.includes(',')) meta[key] = val.split(',').map(s => s.trim());
    else meta[key] = val;
  });
  return { meta, content: rest };
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function extractExcerpt(content) {
  const parts = content.split(/\n\s*\n/);
  if (!parts || parts.length === 0) return '';
  const first = parts[0].replace(/\n/g, ' ').trim();
  return first.length > 200 ? first.slice(0, 197) + '...' : first;
}

function estimateReadTime(md) {
  const words = md.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, function(m) { return ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]; });
}
