## Context
This change updates the entire UI to a dark professional look with futuristic blue accents. It should preserve existing functionality and route structure while improving visual hierarchy, legibility, and perceived quality.

## Goals / Non-Goals
- Goals:
  - Consistent, premium dark theme across all pages
  - Clear typography hierarchy for analytics-heavy screens
  - Futuristic accents via gradients, glows, and subtle motion
  - Responsive layouts that remain legible on mobile
- Non-Goals:
  - No functional or routing changes
  - No data model or API changes

## Decisions
- Decision: Use a blue-forward accent palette with neutral dark surfaces for the base UI.
  - Why: Blue communicates trust and aligns with financial dashboards.
- Decision: Centralize visual tokens in CSS variables and Tailwind config.
  - Why: Ensures consistency and reduces per-page overrides.
- Decision: Use subtle gradients and geometric background patterns.
  - Why: Adds futuristic feel without harming readability.

## Risks / Trade-offs
- Risk: Higher contrast could make some panels feel busy.
  - Mitigation: Enforce spacing and limit accent usage.
- Risk: Heavy gradients or animations could impact performance.
  - Mitigation: Use lightweight CSS gradients and minimal motion.

## Migration Plan
1. Update theme tokens and global styles.
2. Update shared UI components (cards, tables, buttons, badges, modals).
3. Update page layouts for dashboard, marketplace, asset detail, admin.
4. QA all breakpoints and major user flows.

## Open Questions
- Confirm final font choice and weights for headings/body.
- Confirm whether charts should use a single blue palette or multi-hue scheme.
