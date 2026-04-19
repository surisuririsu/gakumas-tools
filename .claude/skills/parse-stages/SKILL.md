---
name: parse-stages
description: Parse Gakumas stage details screenshots into stages.csv rows
---

# Parse Stage Screenshots

Parse a set of screenshots from a Gakumas contest season announcement and generate complete stages.csv rows.

## Input

Screenshots in the directory `screenshots/stages/`. Expected screenshots:
1. Announcement header showing "コンテストシーズンN開催中" (Contest Season N)
2. Stage details table showing stages, turns, support/trouble effects, and P-items

## Instructions

### Step 1: Read all screenshots
Use the Read tool to view each image in the provided directory or paths.

### Step 2: Extract season number
Look for "コンテストシーズンN" in the announcement header to get the season number.

### Step 3: Analyze criteria bars (one per stage)
**As of Season 43**, each stage has its own 審査基準 (criteria) bar, shown in the per-stage header row (`ステージN 審査基準 [bar] プラン [icon]`). Earlier seasons shared a single season-level bar.

Run the analysis script **once per stage** on the image containing that stage's bar:
```bash
python scripts/analyze_criteria_bar.py <image_with_stage_N_bar>
```
Convert percentages to decimals (e.g., 20% → 0.2). Record each stage's criteria separately — they may differ.

### Step 4: Identify plan for each stage
The plan icon appears in each stage's header row, to the right of its criteria bar (`プラン [icon]`). Icons are silver/gray:
- **Sense (センス)**: 8-pointed star with layered petals
- **Logic (ロジック)**: 3D hexagonal cube
- **Free (フリー)**: Rectangular badge with "FREE" text
- **Anomaly (アノマリー)**: Abstract swirling shape with orbital circles

### Step 5: Extract stage data from table
For each stage row, extract:
- Turn count (e.g., "12ターン" → 12)
- Support/Trouble effect (応援/トラブル column) - may be "ー" for none
- P-item name and effect text

### Step 6: Infer turn counts breakdown
Turn counts are roughly proportional to criteria but don't follow a strict algorithm.
Check `tail -15 packages/gakumas-data/csv/stages.csv` for recent stages with similar criteria distributions.

**Important**: The turnCounts don't always match simple `criteria[i] * total_turns` rounding. Look for stages with the exact same criteria values in recent history and use those as reference. The distribution may vary slightly between stages even with the same criteria.

### Step 7: Infer first turn probabilities
1. If any criterion >= 0.45: that one gets 1.0, others get 0
2. Otherwise: highest gets 0.9, second highest gets 0.1, lowest gets 0
3. Tiebreaker: vo > da > vi

Example: criteria=[0.35, 0.4, 0.25] (none >= 0.45)
- Highest: da (0.4) → 0.9
- Second: vo (0.35) → 0.1
- Lowest: vi (0.25) → 0
- Result: [0.1, 0.9, 0]

Quick reference - check `tail -15 packages/gakumas-data/csv/stages.csv` for recent patterns.

### Step 8: Translate effects to DSL
Use the Structured DSL Reference below to convert Japanese effect text to DSL format.

### Step 9: Output CSV rows
Generate one CSV row per stage with this format:
```
id,name,type,preview,season,stage,round,plan,criteria,turnCounts,firstTurns,effects,linkTurnCounts
```

### Step 10: Validate
Run `yarn validate:data` — it parses every DSL column and errors out on unknown phases, variables, actions, or targets.

## Structured DSL Reference

Effects use a block-scoped DSL. Effects are separated by `;` or whitespace;
braces group. Bare `name+=n` assignments are actions — no `do:` prefix needed.
See `packages/gakumas-data/Effects.md` for the full reference.

```
at:<phase> {
  if:<condition> {
    <action>; <action>
    target:<targetExpr> { <growthAction>; <growthAction> }
  }
  limit:<n>
}
```

### Phases (at:)
| Japanese | DSL |
|----------|-----|
| ターン開始時 | `at:startOfTurn` |
| ターン開始後 | `at:afterStartOfTurn` |
| ターン開始前 | `at:beforeStartOfTurn` |
| ターン終了時 | `at:endOfTurn` |
| スキルカード使用時 | `at:cardUsed` (or filter: `at:cardUsed[active]` / `at:cardUsed[mental]`) |
| アクティブスキルカード使用時 | `at:activeCardUsed` |
| メンタルスキルカード使用時 | `at:mentalCardUsed` |
| スキルカード使用後 | `at:afterCardUsed` |
| 好印象の効果ターンが増加後 | `at:goodImpressionTurnsIncreased` |
| 指針が変更した時 | `at:stanceChanged` |
| 〇ターン目 | `at:startOfTurn { if:turnsElapsed==N { ... } }` (N = turn - 1) |

### Conditions (if:)
Multiple conditions may be combined with `&` (and), `|` (or), `!` (not).

| Japanese | DSL |
|----------|-----|
| 好調が N 以上の場合 | `if:goodConditionTurns>=N` |
| 集中が N 以上の場合 | `if:concentration>=N` |
| 好印象が N 以上の場合 | `if:goodImpressionTurns>=N` |
| やる気が N 以上の場合 | `if:motivation>=N` |
| 元気が N 以上の場合 | `if:genki>=N` |
| アイドル固有スキルカード | `if:cardSourceType==pIdol` |
| 好印象効果のスキルカード | `if:cardHasEffect(goodImpressionTurns)` |
| 集中効果のスキルカード | `if:cardHasEffect(concentration)` |
| 絶好調効果のスキルカード | `if:cardHasEffect(perfectConditionTurns)` |
| 直接効果で（指針変更等） | `if:parentPhase==processCard` (or `if:isDirectEffect`) |
| 指針が強気 | `if:isStrength` |
| 指針が温存 | `if:isPreservation` |
| 指針が全力 | `if:isFullPower` |

### Actions (do:)
Actions are bare assignments or function calls — no `do:` prefix.

| Japanese | DSL |
|----------|-----|
| スコア+N | `score+=N` |
| 集中+N | `concentration+=N` |
| 好調+N | `goodConditionTurns+=N` |
| 好印象+N | `goodImpressionTurns+=N` |
| やる気+N | `motivation+=N` |
| 元気+N | `genki+=N` |
| スキルカード使用数追加+N | `cardUsesRemaining+=N` |
| 集中 N 倍 | `concentration*=N` |
| 好印象 N 倍 | `goodImpressionTurns*=N` |
| 集中増加量増加+N%（Mターン） | `setConcentrationBuff(0.N,M)` |
| 好印象増加量増加+N%（Mターン） | `setGoodImpressionTurnsBuff(0.N,M)` |
| スコア上昇量増加 N%（Mターン） | `setScoreBuff(0.N,M)` |
| 指針を変更 | `setStance(preservation)` / `setStance(strength)` / `setStance(fullPower)` |

**Note**: "+" may be misread as "×" in screenshots. When you see "×N", double-check - it's likely "+N".

### Target rules (target:)
Target blocks scope growth actions to a set of cards. They nest inside an
effect body; no need to split into a separate effect.

| Japanese | DSL |
|----------|-----|
| アイドル固有スキルカード | `target:pIdol` |
| アクティブスキルカード | `target:active` |
| メンタルスキルカード | `target:mental` |
| このカード | `target:this` |

Compose with `&` / `|` / `!`: e.g. `target:active & !removed`.

### Growth Actions (g.*)
Inside `target:` blocks, `g.*` names assign persistent growth fields.

| Japanese | DSL |
|----------|-----|
| スコア値+N | `g.score+=N` |
| スコア上昇回数+N | `g.scoreTimes+=N` |
| コスト-N | `g.cost-=N` |

### Modifiers
| Modifier | Meaning |
|----------|---------|
| `limit:N` | Maximum activations per stage |
| `ttl:N` | Time-to-live in turns |
| `delay:N` | Turns to delay before firing |

Place `limit:N` at the scope you want capped — outer effect block for the
whole effect, or inside a nested `if { }` block to cap only that branch's
firings (useful for counter patterns).

### "Every N" Counter Pattern
When effect triggers "〇回...するごとに" (every N times):
```
at:<phase> {
  if:<gate> {
    effectCounter+=1
    if:effectCounter%N==(N-1) { <actions>; limit:M }
  }
}
```
**Important**: Use `%N==(N-1)` (e.g., `%3==2` for "every 3"). The counter increments before the modulo check.

For stance changes, use built-in counter `stanceChangedTimes` or `stanceChangedByCardTimes`:
```
at:stanceChanged { if:parentPhase==processCard & stanceChangedByCardTimes%2==1 { <actions> }; limit:N }
```

### Worked Examples

**アイドル固有スキルカード使用時、集中増加量増加+50%（3ターン）（試験・ステージ内4回）**
```
at:cardUsed { if:cardSourceType==pIdol { setConcentrationBuff(0.5,3) }; limit:4 }
```

**アイドル固有スキルカード使用時、元気が30以上の場合、やる気+10 元気+2（試験・ステージ内4回）**
```
at:cardUsed { if:cardSourceType==pIdol & genki>=30 { motivation+=10; genki+=2 }; limit:4 }
```

**直接効果で指針を2回変更するたび、アイドル固有スキルカードのスコア値増加+25（試験・ステージ内4回）**
```
at:stanceChanged { if:parentPhase==processCard { effectCounter+=1; if:effectCounter%2==1 { target:pIdol { g.score+=25 }; limit:4 } } }
```

**8ターン目、好印象1.5倍**
```
at:beforeStartOfTurn { if:turnsElapsed==8 { goodImpressionTurns*=1.5 }; limit:1 }
```

**指針が強気に変更時（直接効果）、消費体力減少+1、コスト削減+1、スコア上昇量+10%（3回）**
```
at:stanceChanged { if:parentPhase==processCard & isStrength { halfCostTurns+=1; costReduction+=1; setScoreBuff(0.1) }; limit:3 }
```

**ターン終了時、累計全力値が13以上の場合、温存に変更　アイドル固有スキルカードのスコア値増加+30（2回）**
```
at:endOfTurn { if:cumulativeFullPowerCharge>=13 { setStance(preservation); target:pIdol { g.score+=30 } }; limit:2 }
```
**Note**: The old DSL required growth and non-growth actions to be in separate effects. In the new DSL, a `target:` block nests inside a regular effect body — no splitting needed.

## Output Format

Output only the CSV rows, no analysis needed:

```csv
[id],シーズンN ステージ1,contest,TRUE,N,1,,[plan],"[criteria]","[turnCounts]","[firstTurns]","[effects]",
[id],シーズンN ステージ2,contest,TRUE,N,2,,[plan],"[criteria]","[turnCounts]","[firstTurns]","[effects]",
[id],シーズンN ステージ3,contest,TRUE,N,3,,[plan],"[criteria]","[turnCounts]","[firstTurns]","[effects]",
```

Use `[next_id]` for id field - caller will assign actual IDs.

**Note**: preview=TRUE for the current/active season being added. Only set to FALSE for historical seasons.

## Reference
- Full DSL docs: `packages/gakumas-data/Effects.md`
- Recent stages (for pattern matching): `tail -15 packages/gakumas-data/csv/stages.csv`
- Plan icons: `gakumas-tools/public/plans/{sense,logic,free,anomaly}.png`
- Validate: `yarn validate:data`
