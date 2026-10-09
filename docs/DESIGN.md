# Resumind — Design System Specification

**Design System Name:** Resumind Studio Design System  
**Source of Truth:** Google Stitch Project `13898246341962442915`  
**Brand Archetype:** Empirical Career Operating System (Linear / Vercel / Stripe Aesthetic)  
**Theme:** Dark Mode First  
**Typography:** Primary: `Inter`, Monospace / Metrics: `JetBrains Mono`  
**CSS Architecture:** Vanilla CSS Custom Properties (`--rm-*`) + Bootstrap 5 Components (Zero Tailwind CSS bloat)

---

## 1. Design Tokens & Color Palette

### 1.1 Surface Tiers (Atmospheric Depth)
The design system implements a 5-tier architectural depth model using solid, calibrated dark tones rather than generic gray or blurry glassmorphism:

| Token | CSS Variable | Hex / RGBA | Usage |
|---|---|---|---|
| **Canvas Base** | `--rm-canvas-bg` | `#090D16` | Foundational viewport background shell |
| **Subtle Surface** | `--rm-surface-subtle` | `#0B1120` | Recessed containers, inset toolbars, code gutters, input wells |
| **Surface Base** | `--rm-surface-base` | `#0F172A` | Primary card background, table containers, layout panels |
| **Raised Surface** | `--rm-surface-raised` | `#141E33` | Hover cards, elevated interactive states, active tabs |
| **Overlay Surface** | `--rm-surface-overlay` | `#1E293B` | Modal dialogs, dropdowns, slide-out contextual drawers |

### 1.2 Interactive & Brand Accents
| Token | CSS Variable | Hex Value | Usage |
|---|---|---|---|
| **Primary Electric Blue** | `--rm-primary` | `#3B82F6` | Primary CTAs, active indicators, focus outlines |
| **Primary Hover** | `--rm-primary-hover` | `#2563EB` | Button hover and pressed states |
| **Primary Subtle** | `--rm-primary-subtle` | `rgba(59, 130, 246, 0.12)` | Active tab pills, subtle primary highlights |
| **Secondary Taxonomy Violet** | `--rm-secondary` | `#8B5CF6` | Technical skill tags, ontology metadata, Job DNA indicators |
| **Secondary Subtle** | `--rm-secondary-subtle` | `rgba(139, 92, 246, 0.12)` | Skill badge backgrounds |
| **Tertiary Cyan** | `--rm-tertiary` | `#06B6D4` | System telemetry, analytics indicators, info chips |
| **Tertiary Subtle** | `--rm-tertiary-subtle` | `rgba(6, 182, 212, 0.12)` | Telemetry badge backgrounds |

### 1.3 Evidence Guard Triad (Anti-Hallucination Visual Contract)
The proprietary verification triad enforces verifiable truth across ATS scoring and AI tailoring:

| Status | CSS Variable | Background | Border | Text | Icon |
|---|---|---|---|---|---|
| **VERIFIED** | `--rm-verified` | `rgba(16, 185, 129, 0.12)` | `#10B981` | `#34D399` | Checkmark (`✓`) |
| **NEEDS_REVIEW** | `--rm-review` | `rgba(245, 158, 11, 0.12)` | `#F59E0B` | `#FBBF24` | Alert Triangle (`⚠`) |
| **UNSUPPORTED** | `--rm-unsupported` | `rgba(239, 68, 68, 0.12)` | `#EF4444` | `#F87171` | Stop / Cross (`✕`) |

### 1.4 Borders & Outlines
| Token | CSS Variable | Hex Value | Usage |
|---|---|---|---|
| **Subtle Border** | `--rm-border-subtle` | `#1E293B` | Structural dividers, card internal header rules |
| **Default Border** | `--rm-border-default` | `#2A374D` | Card perimeters, table horizontal dividers |
| **Emphasis Border** | `--rm-border-emphasis` | `#3B4D6B` | Hover states, active inputs, modal frames |

### 1.5 Typography Colors
| Token | CSS Variable | Hex Value | Usage |
|---|---|---|---|
| **Primary Text** | `--rm-text-primary` | `#F8FAFC` | Headings, primary data readouts, active labels |
| **Secondary Text** | `--rm-text-secondary` | `#94A3B8` | Body narratives, subtitles, inactive tabs |
| **Muted Text** | `--rm-text-muted` | `#64748B` | Helper captions, timestamp metadata, placeholder copy |

---

## 2. Typography Scale & Font Hierarchy

### 2.1 Font Families
- **Interface & Narrative:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Code, Metrics & Telemetry:** `JetBrains Mono`, SFMono-Regular, Menlo, Monaco, Consolas, monospace

### 2.2 Typographic Hierarchy
| Role | Font Family | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| **Display** | `Inter` | 36px | 700 (Bold) | 44px | -0.025em |
| **Display Mobile** | `Inter` | 28px | 700 (Bold) | 36px | -0.020em |
| **Headline Lg** | `Inter` | 28px | 600 (SemiBold) | 36px | -0.020em |
| **Headline Md** | `Inter` | 22px | 600 (SemiBold) | 30px | -0.015em |
| **Headline Sm** | `Inter` | 18px | 600 (SemiBold) | 26px | -0.010em |
| **Body Lg** | `Inter` | 16px | 400 (Regular) | 24px | 0em |
| **Body Md** | `Inter` | 15px | 400 (Regular) | 22px | 0em |
| **Body Sm** | `Inter` | 13px | 400 (Regular) | 18px | +0.005em |
| **Metric Stat** | `JetBrains Mono` | 24px | 700 (Bold) | 28px | -0.030em |
| **Label Code** | `JetBrains Mono` | 13px | 500 (Medium) | 18px | -0.010em |
| **Label Micro** | `JetBrains Mono` | 11px | 600 (SemiBold) | 14px | +0.040em (Uppercase) |

---

## 3. Spatial System, Borders & Elevation

### 3.1 Spatial Grid (4px Base Unit)
- `--rm-space-xs`: `0.25rem` (4px)
- `--rm-space-sm`: `0.5rem` (8px)
- `--rm-space-md`: `0.75rem` (12px)
- `--rm-space-base`: `1.0rem` (16px)
- `--rm-space-lg`: `1.5rem` (24px)
- `--rm-space-xl`: `2.0rem` (32px)
- `--rm-space-2xl`: `3.0rem` (48px)

### 3.2 Border Radius System
- `rounded-sm` (6px): Badges, micro status chips, code insets, checkbox targets
- `rounded-md` (10px): Action buttons, text inputs, dropdown triggers
- `rounded-lg` (14px): Cards, Kanban columns, diff review panels, modal dialogs
- `rounded-full` (9999px): Avatars, filter pills, ScoreRing terminal caps

### 3.3 Elevation & Shadows
- **Tier 1 (Surface Card):** Hairline 1px border (`#1E293B`), no heavy drop shadow.
- **Tier 2 (Raised Card / Hover):** `box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.45)`.
- **Tier 3 (Modals & Sheets):** `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.60)`.
- **Luminescent Accent Glow:** `0 0 24px -4px rgba(59, 130, 246, 0.25)` around ScoreRing gauge.

---

## 4. Reusable UI Components

### 4.1 Buttons
- **Primary Button (`.btn-primary`):** Solid `#3B82F6` fill with white `#F8FAFC` text, 10px radius. Hover shifts to `#2563EB`. Active state scales slightly (`scale(0.99)`).
- **Secondary / Ghost (`.btn-outline-secondary` / `.btn-ghost`):** Transparent surface with 1px `#2A374D` border, `#F8FAFC` text. Hover elevates to `#141E33` with `#3B4D6B` border.
- **Destructive Button (`.btn-destructive`):** Background `rgba(239, 68, 68, 0.12)`, border `#EF4444`, text `#F87171`. Hover shifts to `#EF4444` with white text.

### 4.2 Form Fields & Inputs
- Background: Inset surface `--rm-surface-subtle` (`#0B1120`).
- Border: 1px `--rm-border-default` (`#2A374D`).
- Focus state: Border transitions to `#3B82F6` with subtle focus ring `0 0 0 2px rgba(59, 130, 246, 0.25)`.
- Text: `#F8FAFC`, Placeholder: `#64748B`.

### 4.3 Cards & Data Containers
- Resting background: `--rm-surface-base` (`#0F172A`).
- Border: 1px `--rm-border-default` (`#2A374D`).
- Card header features a 1px solid `--rm-border-subtle` (`#1E293B`) separator.
- Hoverable cards elevate to `--rm-surface-raised` (`#141E33`) with smooth 150ms transition.

### 4.4 Badges & Status Chips
- Height: 24px, Radius: 6px (`rounded-sm`), Font: `JetBrains Mono` 11px uppercase.
- Verified: emerald badge with checkmark (`✓`).
- Needs Review: amber badge with warning triangle (`⚠`).
- Unsupported: crimson badge with cross (`✕`).

### 4.5 ScoreRing (Radial Score Gauge)
- Radial SVG rendered in 48px, 80px, or 120px diameters.
- Track path: 4px stroked with `--rm-border-subtle` (`#1E293B`).
- Indicator arc: stroked with `--rm-primary` (`#3B82F6`) or status hue with rounded stroke caps.
- Center readout: Bold `JetBrains Mono` metric text.

### 4.6 Diff Review Cards (AI Tailoring)
- Split comparison panels with inset background `#0B1120`.
- Deletions / Original: Left 3px vertical border `#EF4444`, translucent red background tint.
- Additions / Proposed: Left 3px vertical border `#10B981`, translucent green background tint.
- Accompanied by inline Accept / Reject action buttons and Evidence Guard badge.

---

## 5. Responsive Breakpoint Architecture

| Viewport | Range | Layout Configuration |
|---|---|---|
| **Mobile** | `< 768px` | Single-column stack. Sidebar collapses to offcanvas drawer. Page margin 16px. Card spacing 12px. Headings > 28px scale down to 24px. |
| **Tablet** | `768px – 1023px` | Compact 2-column layout. Sidebar collapses to icon rail or offcanvas toggle. |
| **Desktop** | `1024px – 1399px` | Full 12-column grid. Persistent 260px sidebar navigation. Split diff cards in 50/50 layout. Max width 1400px. |
| **Large Desktop** | `>= 1400px` | Full 12-column grid with dedicated contextual audit panel and expanded metric cards. |

---

## 6. Accessibility & SEO Compliance

- **WCAG 2.2 AA Contrast:** All text achieves minimum 4.5:1 contrast on dark surfaces (body `#F8FAFC` on `#0F172A` exceeds 12.5:1).
- **Reduced Motion:** All transitions respect `prefers-reduced-motion: reduce`.
- **Keyboard Navigation:** Full focus ring visibility, logical tab sequences, and ARIA landmarks.
- **Public SEO:** Proper semantic `<main>`, `<header>`, `<h1>` hierarchy, Open Graph metadata, canonical tags, and noindex on protected user dashboards.
