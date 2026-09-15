---
name: Header Redesign Completed
description: UI header redesigned from 3 rows to 2 rows (app bar + toolbar), properties panel updated with stacked labels and custom checkboxes
type: project
---

Header redesign completed on 2026-03-15 (branch: alfonso-frontend-jjtl).

**Why:** Reduce cognitive load and reclaim ~36px vertical space for the canvas.

**How to apply:**
- Header is now 2 rows: App bar (50px) + Toolbar (34px) = ~84px total
- Debug toggle moved to View menu, not in app bar
- Progressive disclosure levels (Basic/Intermediate/Advanced) set in Settings, read-only badge in app bar
- Properties panel uses stacked (vertical) form layout, custom 14px checkboxes (shadcn/ui style)
- Key files: Navbar.tsx, Toolbar.tsx, Info.tsx + their SCSS
- CLAUDE.md already updated with full specs
