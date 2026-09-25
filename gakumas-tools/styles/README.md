# Design system

Everything visual comes from `tokens.scss` (values) and `mixins.scss` (patterns). Components should not introduce their own greys, radii, shadows or easings; if a pattern is missing, add it here first.

## Surfaces

- **Page** `$surface-bg` grey. **Cards** sit on it: `mixins.card` (white, 18px radius, hard 2px edge + soft shadow). A card that is itself a link uses `card-interactive`.
- Inside cards, group with translucent fills (`$fill-muted`, `$fill-subtle`), never with borders or another white card.
- Menus, popovers and sheets use `popover`. Modals use `components/Modal`.

## The three shapes

| Shape | Meaning | Mixin |
| --- | --- | --- |
| Raised (hard bottom edge) | Pressable. Sinks into its edge on tap. | `raised`, `control`, `chip`, `Button` |
| Recessed (inner top shadow) | Editable. Turns white with a blue ring on focus. | `field`, `select`, `Input` |
| Flat (tint, no edge) | Information. Never clickable. | `tag`, stat tiles, table cells |

Never give non-interactive things a hard edge, and never give buttons a flat look.

## Colour roles

- **Orange** (`$brand`, `$accent-*`): the brand and *selection*: selected segment text, selected chips, tab ink, pinned state.
- **Blue** (`$primary`, `$link`): the primary action, links, data (charts) and focus rings.
- **Red** (`$danger`): destructive actions and warnings.
- **Parameters** (`$vocal-*`, `$dance-*`, `$visual-*`, `$stamina-*`): only for Vo/Da/Vi/stamina values, via `param-tones`.
- Text: `$surface-ink`, `$surface-ink-muted` for secondary, `$surface-ink-subtle`/`faint` for hints and placeholders.

## Type roles

- `title` names a page, `heading` names a card or section, `label` names a control. A heading is ink and heavy; a label is small and muted. Don't use `<label>` as a heading.
- Numbers use `numeric` (tabular figures).

## Controls

- Single choice: `ButtonGroup` (sliding thumb) or `TabGroup` (sliding ink). Never hand-roll a segmented control.
- Multiple choice: separate `chip`s with a gap; selected ones use `chip-selected`.
- Text and numbers: `Input`. Dropdowns: a native `<select>` with `select`.
- Tables: `Table`, or `mixins.table` on a hand-written `<table>`.
- Loading: `Loader` (`size="large"` for page-level, `center` to centre it).

## Motion

- Presses sink (`raised`) or shrink (`pressable`) in `$duration-press`, then spring back with `$ease-spring`.
- Selection slides (`ButtonGroup`, `TabGroup`).
- Anything that expands or collapses uses `components/Collapse`; its chevron uses `caret` / `caret-open`.
- Things that appear use `pop-in` (small, playful) or `rise-in` (panels, rows); lists can `stagger` with `--i`.
- Don't animate layout on page load, and never shift layout to show a notice.

## Layers

Page content is isolated below the navbar, so in-page z-indexes only need `$z-raised` / `$z-sticky`. Modals and tooltips use `$z-modal` / `$z-tooltip`.
