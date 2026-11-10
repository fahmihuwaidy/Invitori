---
description: Core runtime invariants for Invori block registry, presets, and React root mounting.
trigger: always_on
---

# Invori Runtime, Design & Block Registry Safeguards

1. **Block Registry Synchronization**:
   - Every block `type` used in `src/utils/presets.js`, `src/pages/EditorPage.jsx`, or `src/pages/PublicInvitationPage.jsx` must have a matching entry in `BLOCK_TYPES` inside `src/utils/blockDefaults.js` with a valid `defaults` object.
   - When referencing `BLOCK_TYPES[type].defaults` in `src/utils/presets.js`, always use optional chaining (`BLOCK_TYPES[type]?.defaults || {}`) so a missing definition never crashes initial module evaluation.

2. **Single React Root Mount**:
   - `src/main.jsx` must call `createRoot(document.getElementById('root')).render(...)` exactly once. Never add a second `createRoot` call or mutate `#root` outside React's tree, as doing so corrupts fiber reconciliation (`removeChild` DOM exceptions).

3. **Supabase Guest & RSVP Parity**:
   - Any new field added to RSVP or Guest forms in `src/pages/PublicInvitationPage.jsx` or `src/pages/DashboardPage.jsx` must be reflected in both `src/contexts/InvitationContext.jsx` and `supabase_schema.sql`.

4. **Desktop Split View Standard**:
   - In `PublicInvitationPage.jsx`, viewport widths >= 1024px must render a dual-pane layout: a fixed left visual showcase (~60%) featuring the couple's cover photo, monogram, and date, paired with a right column (~40%, max 430px) hosting the interactive scrollable invitation feed.

5. **Audio & Opening Gate Invariant**:
   - The public invitation must maintain body scroll lock (`overflow: hidden`) while the cover gate is closed, and atomically unlock scrolling and initiate background audio upon user tap on "Buka Undangan".
   - Background audio must pause on tab visibility change (`document.visibilityState === 'hidden'`).
