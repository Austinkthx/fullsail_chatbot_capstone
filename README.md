# NexusChat Sci-Fi Redesign — File Replacement Guide

## Files to Replace (6 total)

Replace these files in your `nexuschat/client/` folder with the ones in this download:

### 1. `client/public/index.html`
**What changed:** Replaced the Inter + JetBrains Mono fonts with sci-fi fonts:
- **Orbitron** — display headings (NexusChat title, buttons, labels)
- **Share Tech Mono** — monospace/terminal elements (model names, status text)
- **Rajdhani** — body text (messages, inputs, general UI)

### 2. `client/src/App.css` ⭐ (THE BIG ONE)
**What changed:** Complete CSS replacement. This is where 90% of the visual change lives.
- CSS variables at the top define the entire color system (copy these if you use Tailwind)
- Deep space black backgrounds (`#05060a`, `#0a0c14`)
- Electric cyan neon accent (`#00e5ff`) + magenta (`#ff2d78`) + neon green (`#39ff14`)
- Grid background pattern via `body::before`
- Scanline overlay via `body::after`
- Glowing corner brackets on the login card (CSS `::before` / `::after`)
- Sweep-shine button animation (`.btn-primary::before`)
- Neon-lit active session indicator in sidebar
- Gradient edge glow on sidebar border
- Rotating square logo on empty chat state
- Cyan left-border on AI messages, green left-border on user messages
- Holographic glow on the topbar
- Animated status dot pulse

### 3. `client/src/pages/LoginPage.js`
**What changed:**
- Added `<div className="auth-top-bar" />` inside auth-container (cyan accent line)
- Wrapped logo icon in `auth-logo-icon` div (for neon glow box)
- Added `auth-subtitle` div for "Multi-LLM Chatbot" tagline
- Labels now styled with `//` prefix via CSS (no JSX change needed, CSS handles it)
- Submit button uses `btn-primary` class for the sweep-shine animation

### 4. `client/src/pages/ChatPage.js`
**What changed:**
- Topbar wrapped in `topbar-left` div with hamburger button
- Empty state uses `empty-logo` div (rotating square animation)
- Model pills use `model-pill` class with `pill-provider` sub-span
- Input area structure unchanged, just class names aligned

### 5. `client/src/components/Sidebar.js`
**What changed:**
- Brand icon wrapped in `sidebar-brand-icon` div (neon glow box)
- Active conversation uses `conv-item active` for the neon-lit indicator
- User avatar uses `user-avatar` class for cyan border treatment
- Added logout button icon

### 6. `client/src/components/ModelSelector.js`
**What changed:**
- Dropdown uses `model-selector-btn` / `model-dropdown` / `model-option` classes
- Selected state uses `.selected` class (cyan left border + glow)
- Provider shown in `model-provider` span (uppercase monospace)

### 7. `client/src/components/ChatMessage.js`
**What changed:**
- Avatar uses unicode symbols (▶ for user, ◆ for AI) instead of letter initials
- Message uses `message-user` / `message-assistant` classes for colored borders
- Role label is uppercase monospace with color coding

---

## Files You Do NOT Need to Change
- `App.js` — routing logic stays the same
- `index.js` — entry point stays the same
- `context/AuthContext.js` — auth logic stays the same
- `services/api.js` — API calls stay the same
- Entire `server/` folder — backend is untouched

## How to Apply
1. Back up your current `client/src/App.css` (just in case)
2. Copy each file from this download into the matching path in your project
3. Run `npm start` from the `client/` folder
4. That's it — the theme is entirely CSS-driven
