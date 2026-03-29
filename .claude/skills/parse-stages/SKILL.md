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

### Step 3: Analyze criteria bar
Run the analysis script to get precise color percentages:
```bash
python scripts/analyze_criteria_bar.py <image_with_criteria_bar>
```
Convert percentages to decimals (e.g., 20% → 0.2).

### Step 4: Identify plans for each stage
Look at the icons next to "ステージ" in the header row. The icons are silver/gray:
- **Sense (センス)**: 8-pointed star with layered petals
- **Logic (ロジック)**: 3D hexagonal cube
- **Free (フリー)**: Rectangular badge with "FREE" text
- **Anomaly (アノマリー)**: Abstract swirling shape with orbital circles

The icons appear in order: Stage 1 → Stage 2 → Stage 3

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
Use the Effect Translation Reference below to convert Japanese effect text to DSL format.

### Step 9: Output CSV rows
Generate one CSV row per stage with this format:
```
id,name,type,preview,season,stage,round,plan,criteria,turnCounts,firstTurns,effects,linkTurnCounts
```

## Effect Translation Reference

### Phases (at:)
| Japanese | DSL |
|----------|-----|
| ターン開始時 | `at:startOfTurn` |
| ターン開始後 | `at:afterStartOfTurn` |
| ターン開始前 | `at:beforeStartOfTurn` |
| ターン終了時 | `at:endOfTurn` |
| スキルカード使用時 | `at:cardUsed` |
| アクティブスキルカード使用時 | `at:activeCardUsed` |
| メンタルスキルカード使用時 | `at:mentalCardUsed` |
| スキルカード使用後 | `at:afterCardUsed` |
| 好印象の効果ターンが増加後 | `at:goodImpressionTurnsIncreased` |
| 指針が変更した時 | `at:stanceChanged` |
| 〇ターン目 | `at:startOfTurn,if:turnsElapsed==N` (N = turn - 1, 0-indexed) |

### Conditions (if:)
| Japanese | DSL |
|----------|-----|
| 好調が N 以上の場合 | `if:goodConditionTurns>=N` |
| 集中が N 以上の場合 | `if:concentration>=N` |
| 好印象が N 以上の場合 | `if:goodImpressionTurns>=N` |
| やる気が N 以上の場合 | `if:motivation>=N` |
| 元気が N 以上の場合 | `if:genki>=N` |
| アイドル固有スキルカード | `if:cardSourceType==pIdol` |
| 好印象効果のスキルカード | `if:cardEffects&goodImpressionTurns` |
| 集中効果のスキルカード | `if:cardEffects&concentration` |
| 絶好調効果のスキルカード | `if:cardEffects&perfectConditionTurns` |
| 直接効果で（指針変更等） | `if:parentPhase==processCard` |
| 指針が強気 | `if:isStrength` |
| 指針が温存 | `if:isPreservation` |
| 指針が全力 | `if:isFullPower` |

### Actions (do:)
| Japanese | DSL |
|----------|-----|
| スコア+N | `do:score+=N` |
| 集中+N | `do:concentration+=N` |
| 好調+N | `do:goodConditionTurns+=N` |
| 好印象+N | `do:goodImpressionTurns+=N` |
| やる気+N | `do:motivation+=N` |
| 元気+N | `do:genki+=N` |
| スキルカード使用数追加+N | `do:cardUsesRemaining+=N` |
| 集中 N 倍 | `do:concentration*=N` |
| 好印象 N 倍 | `do:goodImpressionTurns*=N` |
| 集中増加量増加+N%（Mターン） | `do:setConcentrationBuff(0.N,M)` |
| 好印象増加量増加+N%（Mターン） | `do:setGoodImpressionTurnsBuff(0.N,M)` |
| スコア上昇量増加 N%（Mターン） | `do:setScoreBuff(0.N,M)` |

**Note**: "+" may be misread as "×" in screenshots. When you see "×N", double-check - it's likely "+N".

### Growth Targets (target:)
| Japanese | DSL |
|----------|-----|
| アイドル固有スキルカード | `target:sourceType(pIdol)` |
| アクティブスキルカード | `target:active` |
| メンタルスキルカード | `target:mental` |

### Growth Actions (do:g.)
| Japanese | DSL |
|----------|-----|
| スコア値+N | `do:g.score+=N` |

### Limits
| Japanese | DSL |
|----------|-----|
| ステージ内 N 回 / 試験・ステージ内 N 回 | `limit:N` |

### "Every N" Counter Pattern
When effect triggers "〇回...するごとに" (every N times):
```
at:[phase],if:[condition],do:effectCounter+=1;
at:[phase],if:[condition],if:effectCounter%N==(N-1),do:[effects],limit:M
```
**Important**: Use `%N==(N-1)` (e.g., `%3==2` for "every 3"). The condition is evaluated before the counter increment applies, so to trigger on the Nth occurrence, check for N-1.

For stance changes, use built-in counter `stanceChangedTimes` or `stanceChangedByCardTimes`:
```
at:stanceChanged,if:parentPhase==processCard,if:stanceChangedByCardTimes%2==1,do:[effects],limit:N
```

### Worked Examples

**アイドル固有スキルカード使用時、集中増加量増加+50%（3ターン）（試験・ステージ内4回）**
```
at:cardUsed,if:cardSourceType==pIdol,do:setConcentrationBuff(0.5,3),limit:4
```

**アイドル固有スキルカード使用時、元気が30以上の場合、やる気+10 元気+2（試験・ステージ内4回）**
```
at:cardUsed,if:cardSourceType==pIdol,if:genki>=30,do:motivation+=10,do:genki+=2,limit:4
```

**直接効果で指針を2回変更するたび、アイドル固有スキルカードのスコア値増加+25（試験・ステージ内4回）**
```
at:stanceChanged,if:parentPhase==processCard,do:effectCounter+=1;at:stanceChanged,if:parentPhase==processCard,if:effectCounter%2==0,target:sourceType(pIdol),do:g.score+=25,limit:4
```

**8ターン目、好印象1.5倍**
```
at:beforeStartOfTurn,if:turnsElapsed==8,do:goodImpressionTurns*=1.5,limit:1
```

**指針が強気に変更時（直接効果）、消費体力減少+1、コスト削減+1、スコア上昇量+10%（3回）**
```
at:stanceChanged,if:parentPhase==processCard,if:isStrength,do:halfCostTurns+=1,do:costReduction+=1,do:setScoreBuff(0.1),limit:3
```

**ターン終了時、累計全力値が13以上の場合、温存に変更　アイドル固有スキルカードのスコア値増加+30（2回）**
```
at:endOfTurn,if:cumulativeFullPowerCharge>=13,do:setStance(preservation),limit:2;at:endOfTurn,if:cumulativeFullPowerCharge>=13,target:sourceType(pIdol),do:g.score+=30,limit:2
```
**Important**: `target:` marks the entire effect line as a growth effect. Growth effects (`target:`, `do:g.*`) must be separated from non-growth effects with `;`. Each effect needs its own phase, conditions, and `limit:`.

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
- Recent stages (for pattern matching): `tail -15 packages/gakumas-data/csv/stages.csv`
- Full effect docs: `packages/gakumas-data/Effects.md`
- Plan icons: `gakumas-tools/public/plans/{sense,logic,free,anomaly}.png`
