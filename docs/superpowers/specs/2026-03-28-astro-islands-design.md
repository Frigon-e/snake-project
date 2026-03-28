# Astro Islands Audit — Design Spec

**Date:** 2026-03-28
**Status:** Approved

## Overview

Audit and modernise BC Exotix to use Astro Islands (client and server) throughout, following Astro best practices. The project is currently 100% server-rendered with zero `client:*` directives and three blocks of inline vanilla JS. This spec introduces Preact as the UI framework for client islands and expands server island usage.

## Architecture

### Framework Addition

Add `@astrojs/preact` integration. All Preact island components live in `src/components/islands/` to make the boundary explicit.

### Island Map

| Island | File | Directive | Purpose |
|---|---|---|---|
| `SnakeForm` | `islands/SnakeForm.tsx` | `client:load` | Full admin create/edit form |
| `TraitChips` | (child of SnakeForm) | — | Optimistic add/delete traits within SnakeForm |
| `InquiryForm` | `islands/InquiryForm.tsx` | `client:idle` | Progressive enhancement on public inquiry form |
| `CopyButton` | `islands/CopyButton.tsx` | `client:load` | Replace inline copy script in media page |
| `DashboardStats` | `islands/DashboardStats.astro` | `server:defer` | Deferred DB count queries on admin dashboard |

The existing `ComplementaryGenetics.astro` server island (`server:defer` on snake detail page) stays unchanged.

## Section 1: SnakeForm Island

### Purpose
Replace the duplicated inline JS in `admin/snakes/new.astro` and `admin/snakes/[id]/edit.astro` with a single reusable Preact island.

### Props
```ts
interface SnakeFormProps {
  snake?: Snake   // undefined = create mode, populated = edit mode
  traits?: TraitChip[]
}
```

### Responsibilities
- **Live slug generation** — auto-derives from name field as user types; user can override manually
- **Sex/status segmented controls** — controlled Preact components; eliminates the hidden-input hack currently used
- **Real-time field validation** — errors shown on blur, mirroring Zod schema rules (slug format, required fields) without a server round-trip
- **Trait chip management** — add/delete traits with optimistic UI: chip appears/disappears immediately, fetch call to Astro Action happens in background, rolls back on error with error toast
- **Form submission** — calls `createSnake` or `updateSnake` action via fetch using the `actions` client helper from `astro:actions`; shows inline loading/error state; redirects to `/admin/snakes` on success

### What it does NOT change
- Astro Actions remain the single source of truth for validation and DB writes
- Page shells `new.astro` and `edit.astro` remain as Astro files; they server-fetch the snake/traits data and pass it down as props to `<SnakeForm client:load />`

### Outcome
Duplication between `new.astro` and `edit.astro` inline scripts is eliminated. Both pages reduce to fetching data and rendering the island.

## Section 2: DashboardStats Server Island

### Purpose
The admin dashboard currently runs 3 COUNT queries synchronously (total specimens, active listings, pending inquiries), blocking the entire page from streaming until all resolve. Deferring them makes the page feel faster.

### Implementation
Extract the 3 stat cards into `DashboardStats.astro`. Use `server:defer` with a skeleton fallback:

```astro
<DashboardStats server:defer>
  <StatCardSkeleton slot="fallback" count={3} />
</DashboardStats>
```

### StatCardSkeleton
New component `src/components/ui/StatCardSkeleton.astro` — renders N placeholder cards with pulsing gray shapes matching the real stat card dimensions.

### What stays the same
- Stat card markup and styling are unchanged
- The specimen registry table below is not deferred (it is primary content)
- DB queries are identical, just moved into the island

## Section 3: InquiryForm Island

### Purpose
Progressively enhance the public inquiry form (in the CTA section) with loading states and inline feedback, while keeping the form functional without JavaScript.

### Progressive Enhancement Pattern
The Astro page retains a native `<form method="POST">` pointing to the `submitInquiry` action as the no-JS fallback. `<InquiryForm client:idle />` replaces the raw form; after Preact hydrates it intercepts submission.

### Before hydration
Native form works — full page reload on submit, server handles result via `Astro.getActionResult`.

### After hydration
- Submit triggers a `fetch` call to the action
- Button shows loading spinner while in-flight
- On success: form replaced inline with a "Your message has been sent" confirmation — no page reload
- On validation error: field-level error messages rendered inline

### Constraints
- No client-side validation before submit — server (Zod) remains authoritative
- `client:idle` not `client:load` — inquiry form is not critical path

## Section 4: CopyButton Island

### Purpose
Replace the inline `<script is:inline>` in `admin/media/index.astro` with a small reusable Preact island.

### Props
```ts
interface CopyButtonProps {
  value: string  // the R2 key to copy
}
```

### Behaviour
- On click: `navigator.clipboard.writeText(value)`, button label changes to "Copied!", resets after 1.5s
- Identical to current behaviour — this is a cleanup, not a feature change

### Usage
```astro
<CopyButton client:load value={r2Key} />
```

## File Changes Summary

### New files
- `src/components/islands/SnakeForm.tsx`
- `src/components/islands/InquiryForm.tsx`
- `src/components/islands/CopyButton.tsx`
- `src/components/islands/DashboardStats.astro`
- `src/components/ui/StatCardSkeleton.astro`

### Modified files
- `astro.config.mjs` — add `@astrojs/preact` integration
- `package.json` — add `@astrojs/preact` and `preact` dependencies
- `src/pages/admin/snakes/new.astro` — remove inline JS, render `<SnakeForm client:load />`
- `src/pages/admin/snakes/[id]/edit.astro` — remove inline JS, render `<SnakeForm client:load snake={snake} traits={traits} />`
- `src/pages/admin/index.astro` — render `<DashboardStats server:defer>`
- `src/pages/admin/media/index.astro` — remove inline script, render `<CopyButton client:load value={key} />`
- `src/pages/index.astro` — replace raw inquiry form in CTA section with `<InquiryForm client:idle />`

### Unchanged
- All Astro Actions (`src/actions/index.ts`)
- `src/components/snakes/ComplementaryGenetics.astro`
- All UI primitives, layout components, and domain components
- Database schema and queries

## Testing

- Unit tests (Vitest): `SnakeForm` slug generation logic, `TraitChips` optimistic update/rollback
- E2E tests (Playwright): admin create flow, admin edit flow including trait add/delete, inquiry form submission, copy button
- Manual: verify forms work without JS (disable JS in browser, confirm native form submission still functions)