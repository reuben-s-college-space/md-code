
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="M%20(1).svg">
    <img src="M%20(1).svg" width="64" height="64" alt="MD Code">
  </picture>
</p>

<h1 align="center">MD Code</h1>

<p align="center">
  <strong>A professional-grade markdown editor with live preview, multi-tab support, and comprehensive export capabilities.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/vanilla-JS-f7df1e?logo=javascript" alt="Vanilla JS">
</p>

---

## Overview

MD Code is a browser-based markdown editor designed for technical writers, developers, and content creators who need a stable, predictable writing environment. It delivers a distraction-free split-pane interface with real-time rendering, multi-tab workflows, and flexible export options — all running entirely client-side with no server dependencies.

## Features

### Editor

- **Multi-tab editing** — Work on multiple files simultaneously with independent state per tab
- **Rich formatting toolbar** — Bold, italic, strikethrough, headings, code blocks, links, lists, blockquotes, horizontal rules
- **Live preview** — Real-time HTML rendering with synchronized scrolling (toggleable)
- **Find & Replace** — Case-insensitive search with live match counting and replace all
- **Syntax-aware editing** — Tab indentation, keyboard shortcuts, and clipboard integration

### File Management

- **Open / Save / Save As** — File System Access API for seamless native file handling in modern browsers; fallback to traditional upload/download for others
- **Open Folder** — Browse and load all markdown files from a directory
- **Recent Files** — Tracks the last 10 files for quick access

### Export

- **Single file export** — HTML, PDF, PNG, JPG, or plain text (TXT)
- **Batch export** — Export multiple open tabs at once in your chosen format
- **ZIP archives** — Package batch exports into a single downloadable archive
- **Quality options** — High (2×) or Medium (1×) resolution for images and PDFs
- **Styled output** — Exports preserve full typographic and thematic styling

### Customization

- **Dark/Light theme** — Toggle with persistent preference via `localStorage`
- **Font selection** — 7 typefaces including Inter, Open Sans, Source Serif 4, JetBrains Mono, Merriweather, Lora, and Roboto; plus a "Disable Font" option to use system defaults
- **Font size** — Adjustable from 13px to 20px
- **View modes** — Editor only, split view, or preview only
- **Draggable gutter** — Resize editor and preview panes to your liking

---

## Quick Start

```bash
git clone https://github.com/reuben-s-college-space/md-code.git
cd md-code
npm install
npm run dev
```

Open `http://localhost:5173` in your browser (Chrome/Edge recommended for best File System API support).

## Build

```bash
npm run build
```

Output is written to the `dist/` directory.

## Deploy

```bash
npm run build
npm run deploy      # pushes dist/ to the gh-pages branch
```

The live site is hosted at [reuben-s-college-space.github.io/md-code](https://reuben-s-college-space.github.io/md-code/).

## Tech Stack

| Layer | Technology |
|---|---|
| **Build** | Vite 6 |
| **CSS** | Tailwind CSS 3 (via PostCSS) |
| **Markdown** | marked |
| **Canvas** | html2canvas |
| **PDF** | jsPDF |
| **Archives** | JSZip |
| **Downloads** | FileSaver.js |

All dependencies are bundled locally — no CDN. The application is a single-page HTML file with ES modules.

## Browser Support

| Feature | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| Live editing & preview | ✓ | ✓ | ✓ |
| File System Access API | ✓ 86+ | — | — |
| File fallback (input/download) | ✓ | ✓ | ✓ |
| Export (PDF, PNG, JPG) | ✓ | ✓ | ✓ |

## Design Philosophy

MD Code follows a _"UI as a Utility"_ design approach — the interface recedes to prioritize your content and workflow. Inspired by the Windows 11 productivity suite aesthetic, it provides a calm, professional writing environment free from visual clutter.

---

<p align="center">
  <sub>Built with vanilla JavaScript, good typography, and a focus on the writing experience.</sub>
</p>
