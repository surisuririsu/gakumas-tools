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

- Single choice: `ButtonGroup` (sliding thumb) or `TabGroup` (sliding ink). Never hand-roll a segmented control. To colour a group, set `--segment`, `--segment-edge`, `--segment-ink` and `--segment-radius` on it (see `ScenarioPicker`).
- Icon choices (plans, idols, ranks): `IconSelect`, which collapses to a dropdown on narrow screens.
- Text and numbers: `Input`; parameter values: `ParametersInput`. Dropdowns: `Select` (or `mixins.select` / `select-active` on a native `<select>`).
- Multiple choice, toggles and filters: separate `chip`s with a gap; selected ones use `chip-selected`. The current pick in a grid of icons gets `selected-ring`. Anything that clips or outlines a game icon uses `$radius-icon`, which matches the frame drawn into the art. Quiet text links use `link-pill`.
- Tables: `Table`, or `mixins.table` on a hand-written `<table>`.
- Loading: `Loader` (`size="large"` for page-level, `center` to centre it).

## Motion

- Presses sink (`raised`) or shrink (`pressable`) in `$duration-press`, then spring back with `$ease-spring`.
- Selection slides (`ButtonGroup`, `TabGroup`).
- Anything that expands or collapses uses `components/Collapse`; its chevron uses `caret` / `caret-open`. Use `keepMounted` when closed content must stay in the server HTML (SEO), and put padding on the `className`, never on the collapsing element itself.
- A value that changes pops in place: `usePopOnChange` / `usePopOnActivate` (`utils/usePop`) return `"A"`/`"B"`, and `mixins.beat` generates the matching `beatA`/`beatB` classes. Alternating classes restart the animation; nothing pops on first render.
- Things that appear use `pop-in` (small, playful) or `rise-in` (panels, rows); lists can `stagger` with `--i`.
- Don't animate layout on page load, and never shift layout to show a notice.

## Exported images

The simulator share image is drawn by html2canvas, which mishandles letter-spacing on centred text, inset shadows and srcset images. The export sets `data-exporting` on its cloned document so `globals.scss` can neutralise those; images inside `#simulator_loadout` should be `unoptimized` (or come from the image CDN).

## Layers

Page content is isolated below the navbar, so in-page z-indexes only need `$z-raised` / `$z-sticky`. Modals and tooltips use `$z-modal` / `$z-tooltip`.
