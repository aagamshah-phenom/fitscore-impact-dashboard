---
name: Design System
type: skill
description: When and how to apply the Phenom design system when building or reviewing UI
triggers: [ui, design, component, style, layout, tailwind, css, color, font, widget, sidebar, badge, workflow, react flow, page layout, design system, button, icon, spacing, typography, theme, nav, tab, card, grid]
---

When building, modifying, or reviewing Phenom UI — load the design system reference and follow it for all visual decisions.

## When to Use This Skill

- **Building new pages or components** — follow the page layout pattern, spacing system, and component patterns
- **Styling decisions** — colors, typography, border radius, hover/active states
- **Adding workflow diagrams** — React Flow node, edge, and layout conventions
- **Code review** — check that UI code follows the established design system
- **Implementing Figma designs** — map Figma specs to the design system's Tailwind classes

## Reference File

Load this file before generating or reviewing UI code:

| Topic | File |
|---|---|
| Full design system (colors, typography, spacing, components, workflows) | `knowledge/design-system/phenom-design-system.md` |

## Quick Reference

These values come up most often — use them without loading the full file for small changes:

- **Font**: Poppins, `font-semibold` for headings, `font-medium` for body
- **Page padding**: `p-8 px-10`
- **Section gap**: `gap-6` (24px)
- **Major section gap**: `gap-8` (32px)
- **Border radius**: `rounded-2xl` containers, `rounded-[10px]` buttons, `rounded-lg` badges
- **Active nav color**: `text-[#7c3aed]` (purple — nav only, never elsewhere)
- **Icons**: Lucide React, `strokeWidth={2}`, `shrink-0`

For anything beyond these basics, read the full reference file.
