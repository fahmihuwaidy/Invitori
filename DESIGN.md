# Design System: Invori — Digital Invitation Studio
**Project ID:** invori-web-app

## 1. Visual Theme & Atmosphere
Invori embodies an **Artisanal Editorial & Old-World Heritage** digital atmosphere. It juxtaposes tactile stationery craftsmanship with modern web agility. The aesthetic is warm, contemplative, and editorial—distinguished by deep forest green tones, dusty antique rose accents, warm paper-cream canvases, and classic serif headlines (`Gambarino`). It deliberately avoids cold neo-brutalist tech tropes, sterile greys, and oversaturated purple AI gradients.

## 2. Color Palette & Roles
- **Deep Forest Olive (`#344C2D`):** Primary brand anchor. Used for primary call-to-actions, prominent headlines, top-level navigation accents, and active states.
- **Deep Forest Olive Hover (`#263821`):** Darker interactive state for primary buttons.
- **Sage / Light Olive (`#899C75`):** Secondary botanical tone for badges, subheadings, and subtle tints (`rgba(137, 156, 117, 0.15)`).
- **Dusty Rose (`#D09CA7`):** Romantic accent color used for floral marks, category eyebrows, and warm highlights. *Caution: Requires darker contrast pairing on light backgrounds to meet WCAG AA.*
- **Warm Paper Cream (`#F4EFEA`):** Ground background tone evoking heavyweight unbleached cotton stationery.
- **Bright Paper White (`#FBF9F6` / `#FFFFFF`):** Elevated container and card surface color.
- **Vintage Deep Charcoal (`#2A3125`):** Primary high-contrast body text ink.
- **Muted Herb Grey (`#6B7266`):** Secondary explanatory captions, metadata, and placeholder text.
- **Warm Linen Border (`#E2DAC9`):** Subtle tactile dividers and container strokes.

## 3. Typography Rules
- **Display & Headline Face (`Gambarino`, Georgia, serif):**
  - Character: Expressive serif with distinctive editorial italics, high contrast strokes, and literary poise.
  - Usage: `h1` (40px - 72px), `h2` (32px - 48px), section titles, and signature italic accents (`.serif-italic`).
- **Body & Functional UI Face (`Inter`, system-ui, sans-serif):**
  - Character: Clean, highly legible neo-grotesque sans-serif.
  - Usage: Body copy (14px - 16px, line-height 1.6 - 1.7), form inputs, labels, and dashboard controls.
- **Label & Small Caps (`.small-caps`, `.label-caps`):**
  - Usage: Eyebrow badges, metadata, status labels. Set in uppercase at 11px - 12px with `0.1em` to `0.15em` letter-spacing. Avoid sub-11px sizing to ensure mobile legibility.

## 4. Component Stylings
- **Buttons:**
  - *Primary Solid:* Deep Forest Olive background (`#344C2D`), white text, crisp slightly rounded corners (`2px` - `4px` radius for editorial elegance), uppercase tracking.
  - *Secondary Ghost/Text:* Bordered in Warm Linen (`#E2DAC9`) or clean underline text with smooth hover transitions.
  - *Accessibility:* Visible focus-ring indicator (`2px solid #344C2D` with `2px` offset) on `:focus-visible`.
- **Cards & Containers:**
  - Surfaces set in Bright Paper White (`#FFFFFF` or `#FBF9F6`) over Warm Cream ground.
  - Corner radius: `8px` - `12px` subtly softened corners, avoiding excessive pill-shaped cards.
  - Elevation: Very subtle paper-elevation shadows (`0 4px 12px rgba(0, 0, 0, 0.05)`), keeping components grounded rather than floating.
- **Inputs & Forms:**
  - Background in crisp white or slight cream tint, surrounded by `1px solid #E2DAC9`.
  - Focused state: Focus border shifts to Deep Forest Olive with subtle sage halo (`0 0 0 3px rgba(137, 156, 117, 0.2)`).

## 5. Layout Principles
- **Whitespace Strategy:** Intentional, generous margins ("Whitespace is luxury") with section spacing ranging from `80px` to `120px` on desktop and `48px` to `64px` on mobile.
- **Grid & Alignment:** Max-width container at `1280px` - `1400px` with `24px` padding on mobile and `60px` padding on desktop.
- **Responsive Flow:** Seamless collapse from multi-column grids to single-column tactile mobile feeds; tap targets minimum `44px` height.

