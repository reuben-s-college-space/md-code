---
name: Productive Desktop System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#414752'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#717783'
  outline-variant: '#c1c6d4'
  surface-tint: '#005eb1'
  primary: '#004f96'
  on-primary: '#ffffff'
  primary-container: '#0067c0'
  on-primary-container: '#dbe7ff'
  inverse-primary: '#a6c8ff'
  secondary: '#605e5c'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2df'
  on-secondary-container: '#666462'
  tertiary: '#833900'
  on-tertiary: '#ffffff'
  tertiary-container: '#a84c00'
  on-tertiary-container: '#ffe0d1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#004787'
  secondary-fixed: '#e6e2df'
  secondary-fixed-dim: '#c9c6c3'
  on-secondary-fixed: '#1c1b1a'
  on-secondary-fixed-variant: '#484645'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68d'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  system-ui-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  system-ui-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  editor-text:
    fontFamily: openSans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  preview-h1:
    fontFamily: inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  preview-h2:
    fontFamily: inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  preview-body:
    fontFamily: sourceSerifFour
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-caps:
    fontFamily: inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  toolbar-height: 48px
  sidebar-width: 260px
  pane-gap: 1px
  container-padding: 32px
  element-gap-sm: 8px
  element-gap-md: 16px
  touch-target: 32px
---

## Brand & Style

The design system is engineered for high-performance productivity, mimicking the functional and rational aesthetic of modern desktop operating systems. The core philosophy is "UI as a Utility," where the interface recedes to prioritize user content and workflow. It targets professionals, technical writers, and developers who require a stable, predictable, and efficient environment.

The visual style is **Corporate / Modern**, drawing inspiration from Windows 11 and high-end productivity suites. It utilizes a rigorous layout, subtle depth, and a high-contrast neutral palette to ensure the user’s cognitive load remains focused entirely on the task of writing and organizing information.

## Colors

The palette is strictly functional, leveraging a professional "Windows Blue" as the primary anchor for interaction and intent.

- **Primary:** A calibrated blue used for active states, primary buttons, and focus indicators.
- **Neutrals:** A spectrum of grays (from `#F3F3F3` for backgrounds to `#201F1E` for text) creates a clear hierarchy of surfaces.
- **Functional:** Success, Warning, and Error colors should follow standard OS conventions (Green, Amber, Red) but remain desaturated to avoid visual noise.

In dark mode, the surfaces shift to deep charcoals and blacks, while the primary blue maintains its luminance to ensure accessibility.

## Typography

This design system uses a multi-font strategy to distinguish between UI, Editor, and Preview contexts:

1.  **System UI (Inter):** Used for menus, toolbars, sidebars, and buttons. It provides a crisp, neutral, and modern look that feels native to the OS.
2.  **Editor (Open Sans):** The default for the writing pane. It offers high legibility for long-form typing with a friendly, humanist touch that reduces eye strain.
3.  **Preview (Source Serif Four):** Employed in the viewing pane to simulate professional publishing and "document" aesthetics, providing a clear visual distinction from the editing environment.
4.  **Monospace (JetBrains Mono):** Used specifically for code blocks within the markdown and the optional "source code" view.

## Layout & Spacing

The layout follows a **Fixed Grid** application model. It is divided into three primary structural zones:

- **Global Navigation/Toolbar:** A fixed 48px top bar containing file actions and markdown formatting tools.
- **Sidebar:** A collapsible 260px left-hand pane for file management and folder structures.
- **Workspace:** A flexible split-pane area (50/50 by default) for the Editor and Preview.

Spacing is governed by an 8px base unit. Interaction targets (buttons in the toolbar) are compact (32px) to maximize screen real estate for content, reflecting a "pro" desktop application feel rather than a mobile-first approach.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** The main application shell uses a light gray (`#F3F3F3`) to create a canvas.
- **Level 1 (Panes):** The Editor and Preview panes are pure white (`#FFFFFF`) with a 1px border (`#E5E5E5`) to separate them from the background.
- **Level 2 (Popovers/Menus):** Dropdown menus and context panels use a soft ambient shadow (4px blur, 10% opacity) and a crisp 1px border to appear physically "above" the workspace.
- **Active State:** Selection in the sidebar or active tabs are indicated with a vertical 3px primary blue "pill" on the leading edge.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a modern, refined look that avoids the harshness of sharp corners while remaining professional.

- **Standard Elements:** Buttons, input fields, and checkboxes use a 4px (0.25rem) corner radius.
- **Large Elements:** Modals and large card containers use 8px (0.5rem).
- **Interactive Indicators:** Tabs and toolbar hover states should use the same 4px radius for consistency.

## Components

### Buttons
- **Primary:** Solid blue background, white text. No gradient. 4px radius.
- **Secondary/Ghost:** Transparent background with a 1px gray border. Text in primary blue or neutral black.
- **Toolbar Icons:** 32x32px hit area, no border. On hover, a light gray (`#EDEBE9`) background square appears.

### Input Fields
- **Search/Editor:** 1px border (`#E5E5E5`). On focus, the border changes to the primary blue with a 1px inner "glow" or thick stroke.

### Tabs
- **Document Tabs:** Rectangular with a 1px border. The active tab has a white background and a 2px blue top-border; inactive tabs have a light gray background.

### Cards & Panes
- **Side-by-side Panes:** Separated by a vertical draggable gutter. The gutter should be 1px wide but have a 4px invisible interaction hit area.

### Markdown Specifics
- **Code Blocks:** Light gray background (`#F3F3F3`), monospace font, 4px padding.
- **Blockquotes:** 4px blue left-border, slightly darker gray text.