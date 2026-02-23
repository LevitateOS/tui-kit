# `shared/tui-kit` Agent Boundary Guide

`tui-kit` is a React + Ink toolkit, not a docs-domain or product-flow engine.

## Canonical ownership

`tui-kit` owns:

- `src/app/*`: app creation and mount lifecycle wrappers
- `src/runtime/*`: terminal/input/focus/exit primitives
- `src/primitives/*`: low-level layout/display blocks
- `src/components/*`: generic widgets (forms/navigation/feedback/data)
- `src/patterns/*`: reusable composition patterns
- `src/theme/*`: tokens/colors/typography/spacing
- `src/hooks/*`: generic hooks

`tui-kit` does **not** own:

- docs-specific rendering/navigation models
- product-specific state machines or business workflows
- backend command orchestration

## Public API rules

- Stable exports are `@levitate/tui-kit` and `@levitate/tui-kit/theme`.
- Do not add a docs-specific subpath export.
- Keep default runtime/module loading ESM-only.

## Design rules

- React hooks are the lifecycle mechanism; do not add a parallel lifecycle subsystem.
- Prefer composable TSX primitives over imperative controller abstractions.
- Fail fast with explicit errors; no silent fallback behavior.
