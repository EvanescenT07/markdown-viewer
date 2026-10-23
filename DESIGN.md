# DocuMark Design System & Direction

## Design Read
Reading this as: Technical documentation workspace and Markdown reader for engineers, product managers, and technical writers, in an editorial-technical visual language, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

Dial: ENERGY 1 / RHYTHM 2 / MOTION 1

## Brand Identity & Motif
- **Identity:** Editorial print manual meets precision technical workbench.
- **Brand Mark:** Typographic wordmark `DocuMark` with a monospace `.md` file-extension tag (`[R-23]`: confirmed typographic mark, no fabricated logo glyph).
- **Identity Motif:** Structural hairlines (`1px solid`), tabular numerals (`font-variant-numeric: tabular-nums`) for byte counts and timestamps, and exposed document metadata headers that echo technical specification sheets.

## Color Palette (`R-29`, `R-25`)
Maximum 2 core surface/text families plus 1 deliberate cobalt accent. All pairings verified with `contrast-check.py`:

### Light Theme (Paper Editorial Default & Print Target)
- **Canvas Background (`--bg-canvas`):** `#FAF9F6`
- **Elevated Surface (`--bg-surface`):** `#F2F0EA`
- **Primary Ink (`--text-primary`):** `#141413` (`17.51:1` on `#FAF9F6`)
- **Secondary Slate (`--text-secondary`):** `#52514E` (`7.54:1` on `#FAF9F6`)
- **Structural Hairline (`--border-subtle`):** `#DCD9D0`
- **Interactive Control Boundary (`--border-interactive`):** `#767570` (`4.38:1` on `#FAF9F6`, passes WCAG 1.4.11 `3:1`)
- **Primary Accent (`--accent-primary`):** `#1D4ED8` (`6.37:1` on `#FAF9F6`, `#FFFFFF` text on `#1D4ED8` is `6.70:1`)
- **Danger / Validation Error (`--status-danger`):** `#B91C1C` (`6.15:1` on `#FAF9F6`)
- **Success / Copied Confirmation (`--status-success`):** `#15803D` (`5.02:1` on `#FAF9F6`)

### Dark Theme (Carbon Slate Workbench)
- **Canvas Background (`--bg-canvas`):** `#121316`
- **Elevated Surface (`--bg-surface`):** `#1A1C20`
- **Primary Bone (`--text-primary`):** `#ECEAE4` (`15.44:1` on `#121316`)
- **Secondary Ash (`--text-secondary`):** `#A09E97` (`6.93:1` on `#121316`)
- **Structural Hairline (`--border-subtle`):** `#2A2D34`
- **Interactive Control Boundary (`--border-interactive`):** `#6E7078` (`3.76:1` on `#121316`, passes WCAG 1.4.11 `3:1`)
- **Primary Accent (`--accent-primary`):** `#60A5FA` (`7.31:1` on `#121316`, `#0A0B0D` text on `#60A5FA` is `7.74:1`)
- **Danger / Validation Error (`--status-danger`):** `#F87171` (`6.72:1` on `#121316`)
- **Success / Copied Confirmation (`--status-success`):** `#4ADE80` (`8.95:1` on `#121316`)

## Typography (`R-06`)
- **UI & Long-Form Prose:** `Plus Jakarta Sans` (humanist sans chosen for high x-height and comfortable long-form specification reading).
- **Code Blocks, File Metadata & Mermaid Source:** `JetBrains Mono` (chosen for clear distinction between `0`/`O` and `1`/`l`/`I` in technical snippets).
- **Fluid Scale (`R-03`):** Uses `clamp()` across headings and prose so narrow viewports and 200% browser zoom reflow without horizontal clipping.

## Decision Log (`R-31`)
- **Color:** Warm paper (`#FAF9F6`) reduces eye strain during long PRD/documentation reading while transitioning cleanly to white print output.
- **Layout:** Split workbench on desktop (upload zone + TOAST-optimized history table) and focused single-column editorial sheet (`max-width: 78ch`) on the reader screen.
- **Typography:** Humanist sans for prose paired with monospace for byte sizes, timestamps, and fenced code blocks.
- **Spacing:** Structural whitespace separates document metadata, toolbar actions, and rendered prose without floating shadows.
- **Radius:** Sharp `4px` (`rounded`) on inputs/code blocks and `6px` (`rounded-md`) on containers to reflect technical document sheets (`R-11`).
- **Icons:** Inline geometric SVG strokes paired directly with visible text labels on every control (`R-04`).

