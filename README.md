# Manager Dashboard Assignment

This project implements the Devantra ERP manager dashboard from the assignment PDF using plain HTML, CSS, and JavaScript, with a structure that is still easy to take to production.

## What is already built

1. Phase 1: Responsive dashboard shell with a sticky top header, collapsible mobile sidebar, stat cards, rating card, progress rings, quick actions, team roster, activity feed, active task list, and leave request panel.
2. Phase 2: Hardcoded dashboard content has been replaced with a mock data layer in `data.js`, and all major sections render from JavaScript.
3. Phase 3: Reusable modal open/close logic, overlay dismissal, form reset on close, member creation modal, task assignment modal, and the bonus reports modal are implemented in `script.js`.

## File map

- `index.html` contains the semantic layout, icon sprite, and modal markup.
- `styles.css` contains the responsive layout, component styling, and modal/sidebar transitions.
- `data.js` exposes `fetchDashboardData()` through the `window.ManagerDashboard` namespace.
- `api.js` contains the POST helpers for `/users` and `/tasks`, with demo fallback enabled by default.
- `script.js` wires rendering, mobile navigation, modal behavior, and form submission.
- `site.webmanifest`, `favicon.svg`, `robots.txt`, `netlify.toml`, and `vercel.json` support static deployment and production metadata.

## Step-by-step build guide

1. Start with the HTML shell in `index.html`: build the sticky header, sidebar, modal containers, and the 3-column dashboard layout.
2. Finish the static UI in `styles.css`: make the dashboard responsive, including the mobile slide-in sidebar and backdrop overlay.
3. Move all content into mock data in `data.js`: keep the UI driven by state instead of hardcoded markup.
4. Render every section in `script.js`: keep one rendering function per responsibility such as `renderStats()`, `renderTeamMembers()`, `renderActivityFeed()`, `renderActiveTasks()`, `renderLeaveRequests()`, and `renderProgress()`.
5. Add interaction: use event delegation for sidebar links, quick actions, profile menu actions, modal triggers, and modal close buttons.
6. Connect the forms through `api.js`: use `POST /users` for the new member form and `POST /tasks` for the task assignment form.
7. Harden UX before submission: validate fields, trap focus inside modals, reset forms on close, and enforce future deadlines for tasks.
8. Keep the app demo-safe: `window.DASHBOARD_CONFIG.demoMode = true` lets the assignment run even if the backend is not available yet.

## How to run it

You can open `index.html` directly in a browser because the project is a static HTML/CSS/JS app and does not require a bundler.

For a cleaner local workflow, use a simple static server such as:

```bash
npx serve .
```

or VS Code Live Server.

If you prefer Python:

```bash
python -m http.server 4173
```

## How to connect a real backend

1. Open `index.html`.
2. Update the inline config block:

```html
<script>
  window.DASHBOARD_CONFIG = {
    apiBaseUrl: "https://your-api.example.com",
    demoMode: false,
    requestTimeoutMs: 10000
  };
</script>
```

3. Make sure your backend exposes `POST /users` and `POST /tasks`.

4. Replace the mock dashboard load in `data.js` with real GET endpoints when they exist.

## Deployment options

1. Netlify
This repo already includes `netlify.toml`. Point Netlify at the repository root and publish the root directory as-is.

2. Vercel
This repo already includes `vercel.json`. Import the repository into Vercel and deploy it as a static site with the root directory.

3. Any static host
Because the project is plain HTML, CSS, JS, and SVG, you can also deploy the root files directly to GitHub Pages, S3, Cloudflare Pages, or Nginx.

## Production-ready next steps

1. Replace the mock `fetchDashboardData()` implementation with real authenticated API reads.
2. Strengthen the current validation with shared schema rules and matching server-side validation.
3. Add loading, empty, and error states for every panel tied to real network requests.
4. Add automated tests for DOM rendering, modal behavior, form submission, and responsive layout checks.
5. Add stronger security headers such as CSP once you know the final hosting platform and API domains.
6. Minify and fingerprint assets if you later move this into a bundler-based deployment pipeline.
7. Add monitoring and error tracking once the real API is connected.

## Submission tips

1. Keep `demoMode` enabled if the reviewer does not have backend access.
2. Record a short walkthrough showing the desktop layout, mobile sidebar, new member flow, assign task flow, and reports modal.
3. Mention clearly that the UI is assignment-complete and API-ready.
