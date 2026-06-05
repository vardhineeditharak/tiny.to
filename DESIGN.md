# Design

## Palette (OKLCH)
We use a **restrained** color strategy, focusing on high-contrast typography, deep slate backgrounds, and a single, precise green accent.

- **Background (`--bg`)**: `oklch(0.10 0.01 240)` - Deep void obsidian.
- **Foreground (`--text`)**: `oklch(0.97 0.005 240)` - High-contrast crisp paper.
- **Muted Foreground (`--text-muted`)**: `oklch(0.60 0.01 240)` - Mid-tone charcoal steel.
- **Accent (`--accent`)**: `oklch(0.78 0.14 145)` - Precise mint/emerald green.
- **Accent hover (`--accent-hover`)**: `oklch(0.83 0.16 145)` - Brightened mint.
- **Border (`--border`)**: `oklch(0.20 0.01 240)` - Low-contrast surface line.
- **Interactive BG (`--control-bg`)**: `oklch(0.14 0.01 240)` - Slightly raised surface.

## Typography
- **Font Family**: Inter, sans-serif for UI and layout; JetBrains Mono or SF Mono for URLs and short codes.
- **Scale**:
  - `h1`: `clamp(2rem, 5vw, 3.5rem)` (tight letter-spacing: `-0.03em`)
  - `body`: `1rem` (line-height: `1.6`)
  - `small`/`code`: `0.875rem`

## Transitions & Motion
- Easing function: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo).
- Micro-interactions on buttons, inputs, and list items.
- Full support for `prefers-reduced-motion`.
