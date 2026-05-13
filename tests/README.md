# Regression harness

Local tools for catching score drift and perf regressions in the structured engine.

## Files

- `suite.jsonl` — frozen list of loadouts with expected scores. Committed; each line is one `{id, query, score, note}` entry so git diffs show score drift clearly.
- `perf-baseline.json` — median runtime per loadout under the reference build. Committed.
- `lib.mjs` — shared runner and I/O helpers.
- `generate-suite.mjs` — one-shot bootstrap (seeded, 500 loadouts).
- `run.mjs` — runs the suite, compares or updates scores.
- `add.mjs` — appends a single loadout with its captured score.
- `bench.mjs` — measures perf and compares to baseline.

## Workflow

### Correctness

```sh
pnpm test:regression          # run suite, fail on any score mismatch
pnpm test:regression:update   # rewrite scores (after intentional behavior change)
pnpm regression:add "<query>" --id=<id> --note="<provenance>"
```

When `pnpm test:regression` fails, each mismatched line prints the expected and actual score — read the diff, decide whether the change was intentional. If yes, run `pnpm test:regression:update` and commit the updated `suite.jsonl`. If no, you have a regression to fix.

Add a loadout to the suite whenever a user reports a bug: it becomes a pinned test that prevents re-regression.

### Performance

```sh
pnpm bench          # compare median runtime against perf-baseline.json
pnpm bench:update   # rewrite baseline
```

Threshold: flags regressions greater than 10%. Re-baseline after an intentional perf change (either direction — both speedups and slowdowns get captured).

## Bootstrap (one-shot)

```sh
pnpm regression:bootstrap        # writes suite.jsonl with 500 seeded loadouts
pnpm bench:update                # captures initial perf baseline
```

The bootstrap script refuses to overwrite an existing `suite.jsonl` — once the suite contains hand-curated entries, preserving them matters.
