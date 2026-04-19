# gakumas-data

Gakumas data with effects in a block-structured, AST-parsed DSL.

## Usage

```js
import { SkillCards, PItems, Customizations } from 'gakumas-data';

const card = SkillCards.getById(720);
const item = PItems.getById(101);
const cust = Customizations.getById(86);
```

## Effect DSL

See **[Effects.md](./Effects.md)** for the full DSL reference — phases,
conditions, target rules, modifiers, anchors, customization patches, and
the complete inventory of state variables and actions.

## Data files

CSVs under `csv/` are the source of truth. JSON under `json/` is generated
by `python3 scripts/csv_to_json.py`.

Each CSV row's DSL columns (`conditions`, `cost`, `actions`, `effects`) are
parsed at package import time via `deserializeEffectSequence` or
`deserializePatchSequence`.

## Validation

Every DSL field is validated against a schema of known phases, variables,
actions, and target identifiers:

```
yarn validate:data
```

Unknown references fail with a precise error pointing at the entity and
column.
