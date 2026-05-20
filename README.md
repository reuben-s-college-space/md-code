# MD Code

A professional-grade markdown editor with live preview, multi-tab support, and comprehensive export capabilities.

## Features

- Multi-tab markdown editing with real-time HTML preview
- File operations: Open, Save, Save As (File System Access API)
- Export: HTML, PDF, PNG, JPG, TXT (single & batch)
- Dark/Light theme with persistent preferences
- Font & font-size selection (7 fonts)
- Find & Replace with live match counting
- Responsive split-pane layout with draggable gutter
- Sync scroll between editor and preview

## Tech Stack

- Vanilla JS (ES6+), HTML5, CSS3
- Tailwind CSS v3 (via PostCSS)
- Vite v6
- marked, html2canvas, jsPDF, JSZip, FileSaver

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`. The GitHub Actions workflow auto-deploys to GitHub Pages on push to `main`.
