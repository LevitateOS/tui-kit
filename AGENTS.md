# `shared/tui-kit` Agent Boundary Guide

This file is the authoritative boundary contract for work in `shared/tui-kit`.

## Prime Intent

`tui-kit` is a reusable terminal UI toolkit.
It is not an application workflow engine for any single product.

Use this package to provide generic, composable UI primitives and page widgets.
Keep product/domain orchestration in the consuming app (for example `tools/recpart/frontend`).

## Ownership: `tui-kit` MUST own

1. Terminal UI foundations:
   - `core/*` (`screen`, `layout`, `events`, `errors`, `lifecycle`)
2. Generic widgets:
   - `widgets/*` (`prompt`, `confirm`, `list`, `scrollable`, `progress`)
3. Shared shell/surface composition:
   - `surfaces/*` (`two-pane` framing and structural visual identity)
4. Generic wizard/page primitives:
   - `pages/*` (`wizard-shell`, `card-list-page`, `async-list-page`, `text-entry-page`, `review-page`)
5. Wizard presentation helpers:
   - `wizard/*` (steps metadata + sidebar rendering)
6. Docs viewer rendering/orchestration primitives:
   - `docs/*` (render helpers + reusable viewer controller)
7. Shared lifecycle mechanics:
   - cancellable task primitives and cleanup guarantees

## Ownership: `tui-kit` MUST NOT own

1. Product-specific workflows or state machines
2. Domain/business policy (install safety policy, confirmation semantics, etc.)
3. Backend command orchestration (`cargo run`, `lsblk`, domain JSON contracts)
4. App-specific content/copy and step ordering decisions
5. Hidden fallback logic that masks caller wiring mistakes

## Ownership: Consumer Apps (e.g. `recpart`) MUST own

1. End-to-end flow/state transitions
2. Domain events and reducer/controller logic
3. Backend IO, JSON parsing, and contract compatibility handling
4. Domain validation and safety gates
5. Final UX decisions that are product-specific

## API Surface Rules

1. Top-level `@levitate/tui-kit` should expose neutral toolkit APIs only.
2. Docs helpers are opt-in and explicit:
   - import from `@levitate/tui-kit/docs`
3. Do not re-bias top-level exports toward docs or any single app vertical.

## Design Rules for New `tui-kit` Features

1. Keep primitives controlled by caller input/state.
2. Prefer returning user intent events/results over embedding product logic.
3. Support cancellation and cleanup via lifecycle scope.
4. Fail fast with explicit errors; no silent fallback.
5. Add tests for edge cases and lifecycle behavior.

## Architecture Mode (Current)

Hybrid model:
- `tui-kit`: reusable primitives + reusable page components + lifecycle utilities
- App: workflow orchestration + domain logic + backend contract use

Do not introduce a full framework-style app runtime/store in `tui-kit` unless multiple consumers prove a stable shared need.
