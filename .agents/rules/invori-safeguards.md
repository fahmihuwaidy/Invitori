---
description: Core runtime invariants for Invori block registry, presets, and React root mounting.
trigger: always_on
---

# Invori Runtime & Block Registry Safeguards

1. **Block Registry Synchronization**:
   - Every block `type` used in `src/utils/presets.js`, `src/pages/EditorPage.jsx`, or `src/pages/PublicInvitationPage.jsx` must have a matching entry in `BLOCK_TYPES` inside `src/utils/blockDefaults.js` with a valid `defaults` object.
   - When referencing `BLOCK_TYPES[type].defaults` in `src/utils/presets.js`, always use optional chaining (`BLOCK_TYPES[type]?.defaults || {}`) so a missing definition never crashes initial module evaluation.

2. **Single React Root Mount**:
   - `src/main.jsx` must call `createRoot(document.getElementById('root')).render(...)` exactly once. Never add a second `createRoot` call or mutate `#root` outside React's tree, as doing so corrupts fiber reconciliation (`removeChild` DOM exceptions).

3. **Supabase Guest & RSVP Parity**:
   - Any new field added to RSVP or Guest forms in `src/pages/PublicInvitationPage.jsx` or `src/pages/DashboardPage.jsx` must be reflected in both `src/contexts/InvitationContext.jsx` and `supabase_schema.sql`.

