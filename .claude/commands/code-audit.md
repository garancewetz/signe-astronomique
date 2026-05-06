# Code Audit

Audit the code currently in progress (uncommitted changes + commits ahead of `main`) against project conventions. Report findings — do **not** auto-fix unless the developer asks.

## Project context

`true-cosmic-sign` is a Vite + React 19 + TypeScript single-page app that renders a cockpit-style astrology view. Stack:

- **React 19** with hooks; no Redux/Zustand/Apollo. Local `useState` + prop drilling, plus a single `useCockpitAudio` hook.
- **Cesium** (via `vite-plugin-cesium`) for the 3D space view, mounted in `src/components/space/`.
- **Framer Motion** for HUD animations.
- **Tailwind v4** (`@tailwindcss/vite`) with utility classes; shared primitives in `src/components/ui/` (`Button`, `Input`, `Field`, `Surface`, `PanelShell`, `cn`).
- **Astro/planet math** lives in `src/utils/astroEngine.ts` and `src/utils/planetEngine.ts`.
- **Code is in English** — identifiers, types, exports, and comments. Only **user-facing copy** (UI labels, panel titles, log messages shown on screen) is in French. Existing French comments are legacy drift; flag them for translation rather than treating them as the convention.

## Scope

By default, audit only what has changed on the current branch:

```bash
git diff main...HEAD --name-only
git diff --name-only
```

If the developer points to a specific file or folder, audit that instead.

## What to Check

For each changed file, look for the following issues. When you find one, report it with a `file:line` reference and a short explanation.

### 1. Project-Specific Anti-Patterns

- **`as Type` casting** — type assertions hide bugs. Suggest type guards, generics, or fixing the data flow. Tolerated for narrow DOM coercions (`e.target as Node`) and for catalog JSON imports that have a verified shape, but flag everything else.
- **Inline `<button>` / `<input>` instead of `ui/` primitives** — use `Button`, `Input`, `Field`, `Surface`, `PanelShell` from `src/components/ui/`. If a primitive doesn't fit, propose extending it rather than re-implementing the styling.
- **`className` strings concatenated by hand** — use `cn()` from `src/components/ui/cn.ts`.
- **Magic Tailwind class clusters duplicated across files** — if the same long class string appears in 2+ places, propose a primitive in `ui/` or a shared constant.
- **Cesium viewer/entity not cleaned up** — every `new Cesium.Viewer`, entity, or event subscription created inside `useEffect` must be destroyed in the cleanup. Memory + WebGL context leaks are silent here.
- **`useEffect` without a dependency array, or with stale closures** — particularly around Cesium and Framer Motion handles. Confirm `react-hooks/exhaustive-deps` would pass.
- **DOM access outside `useEffect` / refs** — no `document.querySelector`, `window.*` reads during render.
- **`eslint-disable` comments** — flag every occurrence and ask whether the underlying issue can be fixed instead.
- **Commented-out code** — must be deleted, not shipped.
- **`console.log` left behind** — `console.warn`/`console.error` for genuine error paths is fine; bare `console.log` is not.

### 2. Architecture & Boundaries

- **Folder responsibilities**:
  - `src/components/` — React components. UI primitives live in `components/ui/`; the Cesium-specific layer lives in `components/space/`.
  - `src/utils/` — pure functions (astro math, exports, geo helpers). No React, no DOM-mounted side effects.
  - `src/hooks/` — custom hooks (currently audio).
  - `src/data/` — static catalogs.
  - `src/types/` — ambient `.d.ts` only.
- **No React imports inside `src/utils/`**. Astro/export helpers must stay framework-agnostic.
- **No Cesium imports outside `src/components/space/`** (and `vite.config.ts`). If a sibling component needs scene access, it should go through the imperative handle exposed by `SpaceView` (`SpaceViewHandle`), not import Cesium directly.
- **Existing helpers first** — before adding a new utility, check `src/utils/` (`astroEngine`, `planetEngine`, `skyCoordinates`, `timezone`, `exportReport`) and `src/components/ui/`.
- **DRY** — duplicated logic, constants, or class strings (≥ 2 occurrences) should be lifted to `utils/`, `data/`, or `ui/` before they multiply.
- **Side effects** — functions outside hooks/components should be pure: no mutation of external state, no DOM access, no `console`. The astro/planet engines are pure on purpose; keep them that way.
- **State location** — form state that must survive panel close/reopen lives in `Cockpit`, not in the panel. Don't move it down without reason.

### 3. Readability & Naming

- **Identifiers and comments in English**, ≥ 3 characters, no acronyms. Component files in PascalCase, utility files in camelCase. French is reserved for user-facing copy (labels, titles, on-screen messages).
- **Comments explain *why*** (a constraint, a Cesium quirk, an astronomical convention), not *what*. Remove redundant comments.
- **Magic numbers** in astro/geometry code → named constants near the top of the file (see `astroEngine.ts` for the established pattern).
- **Explanatory variables** for complex expressions, especially trig and coordinate transforms.

### 4. Function & File Size

- **File** > 400 lines → propose a split. Several files in this repo already sit at 400–700 lines (`ControlConsole.tsx`, `astroEngine.ts`, `SpaceView.tsx`, `Cockpit.tsx`); new growth in those files is a stronger signal to extract.
- **Function** > 60 lines (soft) / 120 lines (hard) → propose extraction.
- **Functions** should be small, single-purpose, with few arguments and no hidden side effects. The astro engine functions are the model: pure, named, composable.

### 5. Source Structure

- Related code grouped vertically; helpers above the component that uses them, or extracted to `utils/`.
- Variables declared close to their first use.
- Callers above callees within a file — read top-down like a story.
- Cesium setup inside one `useEffect`, with cleanup in the returned function.
- Semantic HTML (`<button>`, `<label>` via `Field`, lists, headings) — the cockpit chrome is decorative but the underlying markup should still read correctly to a screen reader.

## Output Format

Group findings by severity, then by file. Use this shape:

```
### 🔴 Blockers
- [src/components/space/SpaceView.tsx:120](src/components/space/SpaceView.tsx#L120) — viewer created in `useEffect` is never destroyed; will leak a WebGL context on unmount.

### 🟠 Should fix
- [src/components/Cockpit.tsx:312](src/components/Cockpit.tsx#L312) — file is 712 lines (limit 400). The `RIGHT_PANELS` config + tab rendering can move to its own module.

### 🟡 Nits
- [src/utils/astroEngine.ts:88](src/utils/astroEngine.ts#L88) — variable `d` should be `daysSinceJ2000`.

### ✅ Looks good
Short note on what is well done — keeps validated patterns visible.
```

End with a one-line verdict: **ready / minor fixes / needs rework**.

## After Reporting

Ask the developer which findings to fix. Do not start editing until they choose — some flags may be intentional (a Cesium workaround, an astronomical convention, a deliberate French label in user-facing copy) and the developer is the source of truth on intent.
