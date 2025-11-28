// Minimal GitHub-backed admin script
// IMPORTANT: Set REPO_OWNER and REPO_NAME to your repo
const REPO_OWNER = 'foxen328';
const REPO_NAME = 'pomodoro-timer-8bit';
const BRANCH = 'main';
const POSTS_PATH = 'posts/';
const INDEX_PATH = POSTS_PATH + 'index.json';

const tokenInput = document.getElementById('token');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const excerptInput = document.getElementById('excerpt');
const contentInput = document.getElementById('content');
const publishBtn = document.getElementById('publish');
const previewBtn = document.getElementById('preview');
const status = document.getElementById('status');
const previewArea = document.getElementById('previewArea');
const previewContent = document.getElementById('previewContent');

// Load token from sessionStorage if present
if (sessionStorage.getItem('gh_token')) tokenInput.value = sessionStorage.getItem('gh_token');

tokenInput.addEventListener('change', () => {
  sessionStorage.setItem('gh_token', tokenInput.value.trim());
});

previewBtn.addEventListener('click', () => {
  const md = contentInput.value || '';
  previewContent.innerHTML = (typeof marked !== 'undefined') ? marked.parse(md) : '<pre>' + escapeHtml(md) + '</pre>';
  previewArea.style.display = 'block';
});

publishBtn.addEventListener('click', async () => {
  status.textContent = '';
  const token = tokenInput.value.trim() || sessionStorage.getItem('gh_token');
  if (!token) return (status.textContent = 'Provide a GitHub token (repo scope)');

  const title = titleInput.value.trim();
  const category = categoryInput.value.trim() || 'uncategorized';
  const excerpt = excerptInput.value.trim();
  const md = contentInput.value || '';
  if (!title || !md) return (status.textContent = 'Title and content are required');

  publishBtn.disabled = true;
  status.textContent = 'Publishing...';

  try {
    // Fetch current index.json (if exists)
    const indexRes = await ghGetFile(INDEX_PATH, token);
    let indexJson = { posts: [] };
    let indexSha = null;
    if (indexRes) {
      indexJson = indexRes.content || { posts: [] };
      indexSha = indexRes.sha;
    }

    // Compute new post id
    const maxId = indexJson.posts.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newId = maxId + 1;

    // Create filename: timestamp-slug.md
    const slug = slugify(title);
    const filename = `${newId}-${slug}.md`;
    const filepath = POSTS_PATH + filename;

    // Prepare metadata item
    const meta = {
      id: newId,
      file: filename,
      title: title,
      category: category,
      excerpt: excerpt,
      date: new Date().toISOString().split('T')[0],
      readTime: estimateReadTime(md)
    };

    // Create the markdown file in the repo
    await ghPutFile(filepath, md, `Add post: ${title}`, token);

    // Update index.json: prepend new post
    indexJson.posts = [meta].concat(indexJson.posts || []);
    await ghPutFile(INDEX_PATH, JSON.stringify(indexJson, null, 2), `Update posts index: add ${filename}`, token, indexSha);

    status.textContent = 'Published successfully.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err.message || err);
  } finally {
    publishBtn.disabled = false;
  }
});

// Helpers for GitHub API
async function ghGetFile(path, token) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get ${path}: ${res.status}`);
  const data = await res.json();
  // Decode JSON content if this is index.json
  if (path.endsWith('.json')) {
    const decoded = atob(data.content.replace(/\n/g, ''));
    return { content: JSON.parse(decoded), sha: data.sha };
  }
  return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha };
}

async function ghPutFile(path, content, message, token, sha = null) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const body = {
    message: message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to put ${path}: ${res.status} ${txt}`);
  }
  return res.json();
}

function slugify(str) {
  return str.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]; });
}

function estimateReadTime(md) {
  const words = md.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}
