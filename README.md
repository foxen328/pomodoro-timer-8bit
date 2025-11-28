# Christopher Fox — Tech Blog (Static)

This repository serves a small static tech blog and CV site. Posts are stored as Markdown files under the `posts/` folder, and the site is a simple client-side static site.

How to add a post
- Create a Markdown file in `posts/` (example: `3-my-new-review.md`).
- Add the post content. The first heading is used by readers as the title (e.g. `# My Review Title`).
- Update `posts/index.json` to include a new entry for the post with fields: `id`, `file`, `title`, `category`, `excerpt`, `date`, `readTime`.

Filename and index example
- Filename: `3-my-new-review.md`
- `posts/index.json` entry example:
```json
{
  "id": 3,
  "file": "3-my-new-review.md",
  "title": "My New Review",
  "category": "hardware",
  "excerpt": "Short summary of the review.",
  "date": "2025-11-28",
  "readTime": "5 min read"
}
```

Previewing locally
- From the repository root run a simple static server and open the site in your browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Publishing
- Commit your new Markdown file and the updated `posts/index.json`, then push to your `main` branch (or open a pull request if you prefer reviews).

Notes
- Currently the site reads `posts/index.json` to know which files to show. If you'd rather drop files and have them auto-discovered, I can update the frontend to read frontmatter from Markdown files instead.
- Keep backups of your posts and use branches/PRs for safer publishing.

If you want, I can also add a small validation script to check `posts/index.json` consistency.
Placeholder
