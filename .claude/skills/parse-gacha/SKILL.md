---
name: parse-gacha
description: Parse Gakumas gacha announcement screenshots into CSV rows for pIdol, skill cards, and p-items
---

# Parse Gacha Announcement

Parse screenshots from a Gakumas gacha announcement and generate CSV rows for p_idols.csv, skill_cards.csv, and p_items.csv.

## Input

Screenshots in the directory `screenshots/gacha/`. Expected screenshots:

1. pIdol name/title information
2. pIdol skill card and p-item details (upgraded versions with full effect text)
3. Support card p-item details (SSR and SR cards)

## Instructions

### Step 1: Read all screenshots

Use the Read tool to view each image in the provided directory or paths.

### Step 2: Get next IDs

```bash
tail -3 packages/gakumas-data/csv/p_idols.csv packages/gakumas-data/csv/p_items.csv packages/gakumas-data/csv/skill_cards.csv
```

### Step 3: Extract pIdol info

From the announcement, identify:

- Idol name (e.g., 花海 咲季) → look up idolId from idols.csv
- Title (e.g., Wildest Flower)
- Plan (センス=sense, ロジック=logic, アノマリー=anomaly)
- Recommended effect (infer from skill card/p-item effects)

Idol ID reference:
| ID | Name |
|----|------|
| 1 | 花海 咲季 |
| 2 | 月村 手毬 |
| 3 | 藤田 ことね |
| 4 | 有村 麻央 |
| 5 | 葛城 リーリヤ |
| 6 | 倉本 千奈 |
| 7 | 紫雲 清夏 |
| 8 | 篠澤 広 |
| 9 | 姫崎 莉波 |
| 10 | 花海 佑芽 |
| 11 | 十王 星南 |
| 12 | 秦谷 美鈴 |
| 13 | 雨夜 燕 |

### Step 4: Extract pIdol skill card

The announcement shows the **upgraded version only**. Create both unupgraded and upgraded rows with identical effects.

- Name ends with + for upgraded version
- sourceType: pIdol
- pIdolId: the new pIdol's ID
- unique: TRUE for pIdol cards

### Step 5: Extract pIdol p-item

Same as skill card - create both unupgraded and upgraded rows.

- Name ends with + for upgraded version
- sourceType: pIdol
- mode: stage
- pIdolId: the new pIdol's ID

### Step 6: Extract support card p-items

For each support card shown:

- SSR or SR rarity
- sourceType: support
- mode: stage (for サポートイベント items) or produce
- No pIdolId

### Step 7: Update EntityBank hidden IDs

Add the unupgraded pIdol item and card IDs to hide them (since we only have upgraded effect text):

- `gakumas-tools/components/EntityBank/EntityBank.js`
- Add to HIDDEN_ITEM_IDS and HIDDEN_CARD_IDS arrays

### Step 8: Validate

Run `yarn validate:data` — it parses every DSL column and errors out on unknown phases, variables, actions, or targets.

## Structured DSL Reference

Effects use a block-scoped DSL. Effects are separated by `;` or whitespace;
braces group. Bare `name+=n` assignments are actions — no `do:` prefix needed.
See `packages/gakumas-data/Effects.md` for the full reference.

```
at:<phase>[<filter>]? {
  if:<condition> {
    <action>; <action>
    limit:<n>
  }
}
```

### Phases

| Japanese           | DSL                                                            |
| ------------------ | -------------------------------------------------------------- |
| レッスン開始時     | `at:startOfStage { ... }`                                      |
| ターン開始時       | `at:startOfTurn { ... }`                                       |
| スキルカード使用時 | `at:cardUsed { ... }` (or filter: `at:cardUsed[active]`)       |
| アクティブ使用時   | `at:activeCardUsed { ... }` (or `at:cardUsed[active]`)         |
| メンタル使用時     | `at:mentalCardUsed { ... }` (or `at:cardUsed[mental]`)         |
| 体力減少時         | `at:staminaDecreased { ... }`                                  |
| 〇ターン後         | `at:turn { if:turnsElapsed==N { ... } }`                       |

### Conditions

Multiple conditions may be combined with `&` (and), `|` (or), `!` (not).

| Japanese                                  | DSL                                     |
| ----------------------------------------- | --------------------------------------- |
| 好印象が N 以上の場合                     | `if:goodImpressionTurns>=N`             |
| 好印象効果のスキルカード                  | `if:cardHasEffect(goodImpressionTurns)` |
| 集中効果のスキルカード                    | `if:cardHasEffect(concentration)`       |
| ターン内にスキルカードをN回使用するごとに | counter pattern with `turnCardsUsed`    |
| ビジュアルターンのみ                      | `if:isVisualTurn`                       |
| スキルカードコストで体力減少時            | `if:parentPhase==processCost`           |

### Actions

Actions are bare assignments or function calls — no `do:` prefix.

| Japanese                          | DSL                                     |
| --------------------------------- | --------------------------------------- |
| 好印象+N                          | `goodImpressionTurns+=N`                |
| やる気+N                          | `motivation+=N`                         |
| スキルカード使用数追加+N          | `cardUsesRemaining+=N`                  |
| 好印象追加発動+N（Mターン）       | `setGoodImpressionTurnsEffectBuff(1,M)` |
| 好印象強化+N%                     | `setGoodImpressionTurnsEffectBuff(0.N)` |
| パラメータ上昇量減少N%（Mターン） | `setScoreDebuff(0.N,M)`                 |
| 消費体力減少Nターン               | `halfCostTurns+=N`                      |

### Cost column

Cost is also an effect sequence. `cost-=2` (no `do:` prefix).

### Counter Pattern

"〇回使用するごとに" (every N uses) — increment a counter, fire on the Nth
occurrence. Use `%N==(N-1)` because the counter increments before the check.

```
at:<phase> {
  if:<gate> {
    effectCounter+=1
    if:effectCounter%N==(N-1) {
      <actions>
      limit:<M>
    }
  }
}
```

The inner `limit:M` applies only to the action firing — the counter still
increments every time. Put `limit:` at the outer level if you want the effect
itself (not just the actions) capped.

## Output Format

### p_idols.csv

```csv
[id],[idolId],[title],SSR,[plan],[recommendedEffect]
```

### skill_cards.csv (both unupgraded and upgraded)

```csv
[id],[name],,SSR,[type],[plan],1,FALSE,TRUE,pIdol,[pIdolId],[forceInitialHand],,[cost],"[actions]",[limit],"[effects]"
[id],[name]+,,SSR,[type],[plan],1,TRUE,TRUE,pIdol,[pIdolId],[forceInitialHand],,[cost],"[actions]",[limit],"[effects]"
```

### p_items.csv

pIdol items (both unupgraded and upgraded):

```csv
[id],[name],SSR,FALSE,[plan],stage,pIdol,[pIdolId],FALSE,"[effects]"
[id],[name]+,SSR,TRUE,[plan],stage,pIdol,[pIdolId],FALSE,"[effects]"
```

Support items:

```csv
[id],[name],[rarity],FALSE,[plan],stage,support,,FALSE,"[effects]"
```

### EntityBank.js updates

```javascript
const HIDDEN_ITEM_IDS = [...existing, [unupgraded_pIdol_item_id]];
const HIDDEN_CARD_IDS = [...existing, [unupgraded_pIdol_card_id]];
```

## Worked Example: Wildest Flower Gacha

**Input from screenshots:**

- pIdol: 【Wildest Flower】花海 咲季, ロジック
- Skill card: 鮮やかに咲く花+ - レッスン開始時手札に入る、好印象が6以上の場合、好印象効果のスキルカードを3回使用するごとに、好印象追加発動+1（3ターン）
- P-item: すべてを超えた先へ+ - レッスン開始時、パラメータ上昇量減少20%（4ターン）、3ターン後、やる気+2・スキルカード使用数追加+1、6ターン後、好印象+4・スキルカード使用数追加+1（レッスン内1回）
- SSR support: 咲季の完全食・改 - ターン内にスキルカードを2回使用するごとに、好印象+2 好印象強化+25%（レッスン内1回）
- SR support: 演技のたしなみ - 【ビジュアルターンのみ】スキルカードコストで体力減少時、好印象+2 消費体力減少2ターン（レッスン内1回）

**Output:**

p_idols.csv:

```csv
130,1,Wildest Flower,SSR,logic,goodImpressionTurns
```

skill_cards.csv:

```csv
783,鮮やかに咲く花,,SSR,mental,logic,1,FALSE,TRUE,pIdol,130,TRUE,,cost-=2,"at:cardUsed { if:cardHasEffect(goodImpressionTurns) & goodImpressionTurns>=6 { effectCounter+=1; if:effectCounter%3==2 { setGoodImpressionTurnsEffectBuff(1,3) } } }",1,
784,鮮やかに咲く花+,,SSR,mental,logic,1,TRUE,TRUE,pIdol,130,TRUE,,cost-=2,"at:cardUsed { if:cardHasEffect(goodImpressionTurns) & goodImpressionTurns>=6 { effectCounter+=1; if:effectCounter%3==2 { setGoodImpressionTurnsEffectBuff(1,3) } } }",1,
```

p_items.csv:

```csv
402,すべてを超えた先へ,SSR,FALSE,logic,stage,pIdol,130,FALSE,"at:startOfStage { setScoreDebuff(0.2,4); limit:1 }; at:turn { if:turnsElapsed==3 { motivation+=2; cardUsesRemaining+=1; limit:1 } }; at:turn { if:turnsElapsed==6 { goodImpressionTurns+=4; cardUsesRemaining+=1; limit:1 } }"
403,すべてを超えた先へ+,SSR,TRUE,logic,stage,pIdol,130,FALSE,"at:startOfStage { setScoreDebuff(0.2,4); limit:1 }; at:turn { if:turnsElapsed==3 { motivation+=2; cardUsesRemaining+=1; limit:1 } }; at:turn { if:turnsElapsed==6 { goodImpressionTurns+=4; cardUsesRemaining+=1; limit:1 } }"
404,咲季の完全食・改,SSR,FALSE,logic,stage,support,,FALSE,"at:cardUsed { if:turnCardsUsed%2==1 { goodImpressionTurns+=2; setGoodImpressionTurnsEffectBuff(0.25) }; limit:1 }"
405,演技のたしなみ,SR,FALSE,logic,stage,support,,FALSE,"at:staminaDecreased { if:parentPhase==processCost & isVisualTurn { goodImpressionTurns+=2; halfCostTurns+=2 }; limit:1 }"
```

EntityBank.js:

```javascript
const HIDDEN_ITEM_IDS = [402];
const HIDDEN_CARD_IDS = [783];
```

## Reference

- Full DSL docs: `packages/gakumas-data/Effects.md`
- Recent entries: `tail -5 packages/gakumas-data/csv/{p_idols,p_items,skill_cards}.csv`
- EntityBank: `gakumas-tools/components/EntityBank/EntityBank.js`
- Validate: `yarn validate:data`
