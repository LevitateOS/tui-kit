# Development Guidelines

These rules apply to this repository, every nested directory, and nested submodules. Inside a LevitateOS checkout, the workspace root `AGENTS.md` also applies across Git boundaries. Local guides may add domain details but must preserve these rules.

- Unit testing is prohibited. Do not add, retain, run, or require unit tests, including assertion-based unit doctests and renamed or mock-only equivalents. Remove them instead of ignoring them.
- Keep development direct. Do authorized work without mandatory paperwork, decision matrices, repeated approvals, coverage targets, or process-only blockers.
- Choose compilation, typechecking, or focused integration/CLI/boot/runtime checks when useful. No mandatory build, lint, test, or policy-audit pipeline on local commits.
- Development submodules may follow working branches; exact superproject pins are required only for release reproduction or preparation.
- Fix behavior in its existing owner, preserve unrelated edits, and report failures honestly.
- Keep runtime checks that prevent invalid artifacts or destructive operations. Do not suppress failures or fabricate success.

# TUI Kit Guidelines

Follow the repository's development guidelines. Unit tests and mandatory process gates are prohibited.

- The kit owns reusable React/Ink components, hooks, terminal input, focus, layout, and themes.
- Apps own product flows, docs schemas, navigation semantics, and backend orchestration. The kit must not import apps.
- Public exports are `@levitate/tui-kit` and `@levitate/tui-kit/theme`; keep ESM-only loading.
- Use React lifecycle and composable TSX components. Fix visual behavior in the component that owns it.
- Keep changes proportional to the defect. Use the observed terminal output to assess rendering fixes.
- Use typechecking or a focused terminal run when useful; do not require decision matrices, reclassification gates, or extra approval rounds.
