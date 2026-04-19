# gakumas-engine

Deterministic simulator for Gakumas stage plays. Given an idol loadout and a
stage, it resolves every phase, effect, buff, and card interaction to a final
score.

## Usage

```js
import {
  IdolConfig,
  StageConfig,
  IdolStageConfig,
  StageEngine,
  StagePlayer,
  STRATEGIES,
} from "gakumas-engine";

const idolConfig = new IdolConfig(loadout);
const stageConfig = new StageConfig(stage);
const config = new IdolStageConfig(idolConfig, stageConfig);

const engine = new StageEngine(config);
const strategy = new STRATEGIES.HeuristicStrategy(engine);
engine.strategy = strategy;

const { score, logs } = await new StagePlayer(engine, strategy).play();
```

## Layout

| Path          | Role                                                           |
| ------------- | -------------------------------------------------------------- |
| `config/`     | Loadout → idol state, stage → config, combined `IdolStageConfig` |
| `engine/`     | `StageEngine` (state machine) and sub-managers: `TurnManager`, `BuffManager`, `EffectManager`, `CardManager`, `Executor`, `Evaluator`, `StageLogger`, `StagePlayer` |
| `strategies/` | `HeuristicStrategy` (auto-play) and `ManualStrategy` (callback-driven) |
| `constants.js`| Stance list, skill-card types, rarities, and the `S` state-key enum |
| `utils.js`    | Seeded PRNG (`resetRand`, `getRandCallCount`) and shared helpers     |

## Data dependency

Effects and entities come from the [`gakumas-data`](../gakumas-data) package.
Effect DSL reference: [`../gakumas-data/Effects.md`](../gakumas-data/Effects.md).

## Determinism

The engine is seeded — two runs with the same inputs and strategy produce
identical scores. `resetRand(seed)` reseeds; `getRandCallCount()` is useful
for debugging divergence between runs.

## Strategies

- **`HeuristicStrategy`** — picks cards by a scoring heuristic. Used for
  bulk simulation in the simulator page.
- **`ManualStrategy`** — delegates every choice to an injected async
  callback, so callers can drive play turn-by-turn (used by the manual-play
  UI).

## Regression harness

`scripts/regression/` at the repo root contains a snapshot-based harness
that runs a frozen loadout suite against the engine and catches scoring
drift. See the top-level `package.json` for `regression:*` and `bench`
scripts.
