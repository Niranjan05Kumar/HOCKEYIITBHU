---
name: Heritage Athletic Archive
colors:
    surface: "#fcf9f2"
    surface-dim: "#dcdad3"
    surface-bright: "#fcf9f2"
    surface-container-lowest: "#ffffff"
    surface-container-low: "#f6f3ec"
    surface-container: "#f1eee7"
    surface-container-high: "#ebe8e1"
    surface-container-highest: "#e5e2db"
    on-surface: "#1c1c18"
    on-surface-variant: "#544242"
    inverse-surface: "#31312c"
    inverse-on-surface: "#f3f0e9"
    outline: "#877272"
    outline-variant: "#d9c1c0"
    surface-tint: "#964649"
    primary: "#3d030b"
    on-primary: "#ffffff"
    primary-container: "#5a181e"
    on-primary-container: "#da7d80"
    inverse-primary: "#ffb3b4"
    secondary: "#765a1a"
    on-secondary: "#ffffff"
    secondary-container: "#fed88b"
    on-secondary-container: "#795d1c"
    tertiary: "#00210e"
    on-tertiary: "#ffffff"
    tertiary-container: "#07381e"
    on-tertiary-container: "#73a380"
    error: "#ba1a1a"
    on-error: "#ffffff"
    error-container: "#ffdad6"
    on-error-container: "#93000a"
    primary-fixed: "#ffdad9"
    primary-fixed-dim: "#ffb3b4"
    on-primary-fixed: "#3e030c"
    on-primary-fixed-variant: "#782f33"
    secondary-fixed: "#ffdea0"
    secondary-fixed-dim: "#e7c277"
    on-secondary-fixed: "#261a00"
    on-secondary-fixed-variant: "#5c4301"
    tertiary-fixed: "#bceec8"
    tertiary-fixed-dim: "#a1d2ad"
    on-tertiary-fixed: "#00210f"
    on-tertiary-fixed-variant: "#224f33"
    background: "#fcf9f2"
    on-background: "#1c1c18"
    surface-variant: "#e5e2db"
    canvas: "#F4F1EA"
    surface-card: "#ECE8E1"
    surface-hover: "#E2DDD4"
    dark-overlay: "#121212"
    text-primary: "#1A1A1A"
    text-secondary: "#6B665F"
    text-tertiary: "#9C968D"
    status-win: "#2D5A3D"
    status-loss: "#7A2E2E"
    status-draw: "#7D7871"
typography:
    display-hero:
        fontFamily: Inter
        fontSize: 72px
        fontWeight: "500"
        lineHeight: "1.05"
        letterSpacing: -0.03em
    display-hero-mobile:
        fontFamily: Inter
        fontSize: 42px
        fontWeight: "500"
        lineHeight: "1.1"
        letterSpacing: -0.02em
    section-title:
        fontFamily: Inter
        fontSize: 30px
        fontWeight: "500"
        lineHeight: "1.2"
        letterSpacing: -0.02em
    card-header:
        fontFamily: Inter
        fontSize: 18px
        fontWeight: "500"
        lineHeight: "1.4"
        letterSpacing: -0.01em
    body-main:
        fontFamily: Inter
        fontSize: 14px
        fontWeight: "400"
        lineHeight: "1.6"
        letterSpacing: -0.01em
    metadata:
        fontFamily: Inter
        fontSize: 12px
        fontWeight: "500"
        lineHeight: "1"
        letterSpacing: 0.02em
spacing:
    p-6: 1.5rem
    p-10: 2.5rem
    p-16: 4rem
    gutter: 1.5rem
    margin-mobile: 1rem
    margin-desktop: 4rem
---

## Brand & Style

This design system is built upon a philosophy of **Editorial Minimalism and Heritage Preservation**. It is designed to feel like a high-end digital museum—timeless, institutional, and premium. The aesthetic bridges the gap between historical archival integrity and modern digital clarity.

The visual direction follows a **Modern-Brutalist-Editorial** mix:

- **Minimalism:** Aggressive use of whitespace to allow historical photography to breathe and command attention.
- **Structural Integrity:** Reliance on sharp corners, hairline borders, and rigid grids rather than shadows or decorative effects.
- **Institutional Authority:** A palette that mimics physical parchment, ink, and traditional collegiate colors to evoke a sense of long-standing prestige.
- **Tactile Modernism:** Interactive elements utilize "pill" shapes to create a clear distinction between static archival content (sharp) and functional UI (rounded).

The emotional response should be one of respect, nostalgia, and clarity. It avoids "tech-first" trends (like blurs or neon) in favor of a "document-first" approach.

## Colors

The color system is inspired by physical archives—aged paper, charcoal ink, and traditional athletic dyes.

- **Canvas & Surface:** The foundation is `#F4F1EA` (Canvas), a warm off-white that reduces eye strain and feels more "archival" than pure white. Depth is achieved through tonal shifts to `#ECE8E1` for cards and `#E2DDD4` for interaction states.
- **Typography:** Text levels use decreasing shades of charcoal and taupe to establish hierarchy without relying on size alone.
- **Heritage Accents:** `Heritage Maroon` is the primary identity color, used sparingly for impact. `Victory Gold` is reserved for championships and high-tier honors.
- **Sports Data:** Match outcomes utilize muted, low-saturation versions of green, red, and grey to maintain the editorial sobriety of the system while providing clear data visualization.

## Typography

The system utilizes a geometric sans-serif stack—specifically **Inter** (set with tight tracking)—to achieve a contemporary-yet-classic feel.

- **Tight Tracking:** Display and Section titles must use negative letter-spacing (`-0.03em` to `-0.02em`) to mimic mid-century editorial layouts.
- **Vertical Rhythm:** A relaxed leading (line-height) of `1.6` is applied to body text to ensure long-form historical narratives remain legible and academic in tone.
- **Hierarchy through Weight:** Use `Medium (500)` for titles and `Regular (400)` for narrative content. Metadata should always be uppercase with slight positive tracking to ensure readability at small sizes.

## Layout & Spacing

This design system employs a **Fixed-Grid philosophy** within a fluid container to maintain structural alignment.

- **Grid Model:** A 12-column grid is used for desktop layouts, typically broken into 4-column cards or 6-column narrative blocks.
- **Whitespace Scale:**
    - `p-6 (24px)`: Standard internal padding for cards and components.
    - `p-10 (40px)`: Vertical spacing between related sections.
    - `p-16 (64px)`: Significant breathing room for hero sections and major content breaks.
- **Breakpoints:**
    - **Desktop (≥1024px):** Full 12-column grid with 64px outer margins.
    - **Tablet (768px - 1023px):** 8-column grid with 40px outer margins.
    - **Mobile (<768px):** 4-column grid with 16px outer margins. Elements should mostly stack vertically to prioritize the reading experience.

## Elevation & Depth

To maintain the "Heritage Archive" feel, this system **avoids all drop shadows and gradients.** Depth is communicated through architectural layering:

1.  **Tonal Layering:** The primary method of elevation. Objects "closer" to the user are rendered in subtly different neutral tones (e.g., a Card in `Surface Card` resting on a `Canvas Primary` background).
2.  **Hairline Borders:** Use `rgba(26, 26, 26, 0.08)` for standard separation. This creates a "blueprint" or "ledger" feel. On hover, increase border opacity to `0.25` rather than adding a shadow.
3.  **Inversion:** Use the `Dark Overlay (#121212)` for high-importance modals, admin states, or "Night Mode" archival viewing. This provides the maximum level of depth and focus.

## Shapes

The shape language is primarily **sharp and structural**.

- **Primary Containers:** Cards, image frames, and section dividers use a `0px` radius (Sharp) to evoke the edges of printed photographs and archival documents.
- **Subtle Rounding:** A `4px` (Soft) radius may be used for internal UI elements like input fields or smaller containers to provide a hint of modern approachability.
- **Interactive Pill:** All buttons, status badges (Win/Loss), and filter chips must use a `rounded-full` (Pill) shape. This creates a clear visual affordance that these elements are interactive "objects" placed on top of the static archive.

## Components

- **Buttons:** Primary buttons use `Heritage Maroon` with `Inverted Text`. Secondary buttons are outlined with 1px hairlines. All buttons must be pill-shaped.
- **Cards:** Sharp-edged (`0px`), background color `Surface Card`, with a 1px hairline border. Hover state shifts background to `Surface Hover`.
- **Badges/Chips:** Small, pill-shaped elements using the status colors (`Win`, `Loss`, `Draw`) with `Inverted Text`. Metadata tags use `Surface Hover` with `Text Secondary`.
- **Input Fields:** Subtle `4px` rounding, 1px hairline border, using `Text Primary` for labels and `Text Tertiary` for placeholder text.
- **Lists:** Clean, border-bottom separated rows. Use `Metadata` typography for timestamps or indices on the left-hand side.
- **Archival Timeline:** A vertical 1px line that anchors chronological data. Events are marked by small circles that expand on hover.
- **Photo Frames:** Images should have no rounding. Use a `p-6` background padding of `Surface Card` to mimic a physical photo mount.
