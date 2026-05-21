# MD Code — Implementation & Bug Fix Log

> Generated: 2026-05-21
> Covers all changes from initial build through current state.

---

## 1. Major Implementations (Descending Priority)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-Tab System** | Independent file states per tab, tab switching with scroll preservation, dirty indicator (red dot) for unsaved changes |
| 2 | **Live Preview** | Real-time markdown-to-HTML rendering via marked.js, synchronized scrolling (toggleable) |
| 3 | **File Operations** | Open, Save, Save As, New File, Open Folder with .md filtering, multi-select open |
| 4 | **Export System** | HTML, PDF, PNG, JPG, TXT single-file export + batch export with ZIP packaging, quality options |
| 5 | **Electron Desktop Wrapper** | NSIS installer, .md/.markdown file associations, single-instance lock, IPC file reading, portable build |
| 6 | **Sidebar Resizer** | Pointer-events-based drag with `setPointerCapture`, cross-browser compatibility, width persistence via localStorage |
| 7 | **Theme System** | Dark/Light mode toggle with localStorage persistence, complete interface coverage (editor, preview, sidebar, menus) |
| 8 | **Font System** | 7 fonts + "Disable Font" option, applies to both editor and preview panes, font size selection (13px–20px) |
| 9 | **Find & Replace** | Case-insensitive search, replace single/all occurrences, match count, navigate between matches |
| 10 | **Status Bar** | Cursor position (Ln/Col), word count, character count, branch indicator |
| 11 | **Recent Files** | Last 10 files tracked in localStorage, click to open, grouped by directory in explorer panel |
| 12 | **Explorer Panel** | File history metadata, grouped directory tree, click-to-open, desktop native paths via Electron preload |
| 13 | **Keyboard Shortcuts** | Ctrl+B/I/D/H/K/L/Q for formatting, Ctrl+F for find, Ctrl+S/O/N for file ops, Ctrl+Shift+K for code block |
| 14 | **Settings Panel** | Theme toggle, font/size selection, collapsible overlay |
| 15 | **Copy HTML** | One-click copy of rendered HTML to clipboard |
| 16 | **Workspace Path** | Displays current folder path in sidebar header |
| 17 | **Open Folder** | Browse filesystem, filter to .md only, checkboxes + multi-select with "Open Selected" button |
| 18 | **View Modes** | Editor Only, Split View (default), Preview Only toggles |
| 19 | **File System Access API** | Modern browser file handle persistence for seamless save, fallback to traditional input/download |
| 20 | **Binary File Handling** | Placeholder text when opening non-text files (PDF, PNG, JPG) |

---

## 2. Bug Fixes (Descending Priority)

| # | Fix | Severity | Description |
|---|-----|----------|-------------|
| 1 | **preload.cjs UTF-16LE corruption** | `P0` | Stripped orphan UTF-16LE bytes appended after valid JS that called undefined `getFilePathFromArgs` — root cause of file association failure (preload crashed → `electronAPI` never exposed) |
| 2 | **Double URL-encoding in main.cjs** | `P0` | Removed `encodeURIComponent()` from `loadFile` query — Electron already encodes query values, causing double-encoding that corrupted file paths on open |
| 3 | **Batch export captures wrong tab** | `P1` | `capturePreviewFull` now renders from `state.content` directly instead of cloning the active tab's DOM — fixes batch export of non-active tabs |
| 4 | **innerText → textContent** | `P1` | Replaced all 13 occurrences — prevents whitespace corruption, code block indentation loss, and forced reflow on contenteditable |
| 5 | **Font selector broken in preview** | `P1` | Removed hardcoded `font-family` from h1–h6, p, li child selectors so user's font choice actually applies to preview text |
| 6 | **insertAtCursor horizontal rule** | `P1` | Fixed `insertAtCursor('\n---\n', '')` — was passing undefined `after` parameter producing `\n---\ntextundefined` |
| 7 | **Mobile sidebar overlay** | `P1` | Hidden sidebar on mobile (`<768px`) since no toggle exists to show/hide it — prevents sidebar from blocking 34% of viewport |
| 8 | **Sidebar resizer pointer events** | `P1` | Rewrote from `mousedown` to `pointerdown` with `setPointerCapture` for reliable cross-browser drag tracking |
| 9 | **Preview toggle icon update** | `P1` | Fixed dark mode toggle icon to update correctly on theme change |
| 10 | **window.find() non-standard API** | `P2` | Replaced with JS-based TreeWalker search + Range selection — works in Firefox/Safari, searches only editor content (not entire DOM) |
| 11 | **Settings theme toggle missing re-render** | `P2` | Added `marked.parse` call to settings panel toggle to match header toggle behavior |
| 12 | **Stale cursor after tab switch** | `P2` | Explicitly set cursor to editor start after `mountEditor` — was showing previous tab's cursor position in status bar |
| 13 | **Toolbar operations lose cursor** | `P2` | `insertLinePrefix` now saves and restores cursor offset after content modification — was jumping to start of editor |
| 14 | **Identical ternary branches** | `P2` | Simplified `maybeOpenFromHistory` — removed dead `dirMatch` check where both branches were `folderEntries[entry.name]` |
| 15 | **Dead CSS selectors** | `P2` | Removed `#editor-area`, `#preview-area`, `.active-tab-indicator` (~30 lines of dead code that never matched any element) |
| 16 | **Duplicate .gutter definitions** | `P2` | Merged into single block with transition + separated hover/dragging states — was defined in two separate locations |
| 17 | **Sidebar toggle removal** | Feature | Removed collapse/expand toggle entirely — sidebar now always visible and resizable via gutter drag |
| 18 | **Firefox compatibility** | `P3` | Added `scrollbar-width`/`scrollbar-color` fallbacks alongside WebKit-only scrollbar styles, added `-moz-tab-size` prefix |
| 19 | **mainWindow null race** | `P3` | `second-instance` handler now falls through to `openFileInWindow` which guards `mainWindow` with `if (!mainWindow)` check |
| 20 | **macOS open-file timing** | `P3` | Added `pendingOpenFile` queue for files opened before window creation — prevents lost IPC messages on macOS |

---

## 3. Persisting Bugs (Known Issues)

| # | Bug | Severity | Description | Effort |
|---|-----|----------|-------------|--------|
| 1 | **File association unreliable** | `P0` | Double-clicking .md files sometimes falls back to untitled.md — may need additional IPC timing fixes or renderer readiness check | ~2 hours |
| 2 | **Preview not rendering on Ctrl+O** | `P1` | Opening files via Ctrl+O sometimes shows blank preview — may be preview pane collapsed from previous session (localStorage persistence) | ~30 min |
| 3 | **No error feedback on file read failure** | `P2` | Silent failure when `readFile` returns null — user sees untitled.md with no alert or status message | ~15 min |
| 4 | **Second-instance no visual feedback** | `P2` | When opening file via double-click on running app, no toast/notification that a new tab was opened | ~30 min |
| 5 | **IPC timing race condition** | `P2` | Renderer `onOpenFile` listener may not be registered when IPC message arrives from `second-instance` — need `did-finish-load` guard | ~1 hour |
| 6 | **getFilePathFromArgs regex too loose** | `P2` | `includes(':')` matches `--flag:value`; UNC paths (`\\server\share`) may not match correctly; should use drive-letter pattern `/^[a-z]:\\/i` | ~20 min |
| 7 | **Dedup by basename only** | `P2` | `C:\a\README.md` and `D:\b\README.md` deduplicate as same file — should compare by full path or `nativePath` | ~30 min |
| 8 | **No debouncing on preview re-render** | `P3` | `marked.parse` fires on every keystroke — causes jank on large files (10k+ lines) | ~30 min |
| 9 | **Marked.js sanitization disabled** | `P3` | Raw HTML in markdown renders without escaping — security risk for untrusted content | ~15 min |
| 10 | **Export/preview CSS duplication** | `P3` | `.preview-export` and `#preview-pane-content` rules must be kept in sync — fragile, updates to one set often miss the other | ~1 hour |
| 11 | **Re-creates DOM on tab switch** | `P3` | Mounts/unmounts editor and preview elements on every tab switch instead of hiding/showing — performance cost | ~2 hours |
| 12 | **insertAtCursor fallback appends to end** | `P3` | When no selection exists (`sel.rangeCount === 0`), appends to end of content instead of inserting at cursor position | ~20 min |
| 13 | **Search expand button no handler** | `P3` | `#search-replace-toggle` button in header has title "Toggle Replace" but no click handler attached in app.js | ~10 min |
| 14 | **PDF export clobbers cursor status** | `P3` | Hardcodes "Ln 1, Col 1" in status bar after export regardless of actual cursor position | ~10 min |
| 15 | **Misleading indentation in batch export** | `P3` | Wildly inconsistent indentation (8-space jumps) in `app.js:549-570` — maintenance hazard, suggests broken refactoring history | ~30 min |
| 16 | **renderExplorerDOM double-fires** | `P3` | Re-renders content that's invisible when explorer section is hidden but has lingering DOM children | ~15 min |
| 17 | **Inconsistent naming in docs** | `P3` | Files are `main.cjs`/`preload.cjs` but `CONTEXT.md` and user references use `.js` extension | ~10 min |

---

## 4. Timeline

| Date | Event |
|------|-------|
| **Phase 1 — Foundation** | Initial HTML structure based on provided mockup (`code.html`), basic markdown parsing with marked.js, single-file editor/preview setup |
| **Phase 2 — Core Features** | File open/save/save as, dark/light mode toggle, font selection, draggable splitter |
| **Phase 3 — Multi-Tab System** | Tab management, independent file states per tab, tab switching with state preservation |
| **Phase 4 — Export System** | Single file export (HTML/PDF/PNG/JPG/TXT), batch export with ZIP, quality options, full content capture |
| **Phase 5 — Polish & Fixes** | Dark mode text color fixes, font sync to preview, open folder feature, search bar centering, binary file handling |
| **Phase 6 — Electron Desktop** | Desktop wrapper with NSIS installer, .md file associations, single-instance lock, IPC file reading, Open With support |
| **Phase 7 — Explorer Panel** | File history metadata, grouped directory tree, click-to-open, desktop native paths via Electron preload |
| **Phase 8 — Sidebar Resizer** | Pointer-events-based drag, cross-browser compatibility, width persistence, removed sidebar toggle |
| **Phase 9 — Bug Sweep** | preload.cjs corruption fix, double URL-encoding fix, batch export fix, innerText→textContent, font selector fix, window.find replacement, cursor fixes, Electron edge cases |

---

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| CSS Framework | Tailwind CSS (via CDN) |
| Markdown Parser | marked.js v15.0.7 |
| HTML-to-Markdown | Turndown.js v7.2.0 |
| Image Capture | html2canvas v1.4.1 |
| PDF Generation | jsPDF v2.5.2 |
| ZIP Packaging | JSZip v3.10.1 |
| File Saving | FileSaver.js v2.0.5 |
| Icons | Material Symbols Outlined (Google Fonts) |
| Fonts | Inter, Open Sans, Source Serif 4, JetBrains Mono, Merriweather, Lora, Roboto |
| Desktop | Electron v42.2.0 + electron-builder v26.8.1 |
| Build | Vite v6.3.2 |

---

## 6. File Structure

```
test-opencode/
├── index.html              # Main application file
├── package.json            # Dependencies, scripts, electron-builder config
├── vite.config.js          # Vite build configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── icon.svg                # Application icon (SVG source)
├── rem_implementations.md  # This file — implementation & bug fix log
├── CONTEXT.md              # Application context & design system
│
├── src/
│   ├── app.js              # Main application logic
│   └── styles.css          # Custom styles (Tailwind + overrides)
│
├── electron/
│   ├── main.cjs            # Electron main process
│   └── preload.cjs         # Electron preload script (context bridge)
│
── dist/                   # Vite build output (generated)
├── release/                # Electron build output (generated)
│   ── MD-Code-1.0.0-Setup.exe
│
└── test-files/             # Test markdown files
    ├── test1_basic.md
    ├── test2_darkmode.md
    ── test3_multitab.md
```

---

## 7. Severity Legend

| Label | Meaning |
|-------|---------|
| `P0` | **Critical** — App crashes, core feature broken, data loss risk |
| `P1` | **High** — Feature broken or severely degraded, user-visible bug |
| `P2` | **Medium** — Feature works but with incorrect behavior or edge case failures |
| `P3` | **Low** — Minor UX issue, code smell, maintenance hazard, cosmetic |

---

## 8. Notes

- All dependencies loaded via CDN (no local installation needed for web version)
- No build process required for web version (single HTML file)
- Electron version requires `npm run build` before `npm run electron:dev` or `npm run electron:build`
- File System Access API limited to secure contexts (HTTPS/localhost)
- Binary files (PDF, PNG, JPG) show placeholder text when opened
- Large files may cause performance issues (no debouncing on preview re-render)
