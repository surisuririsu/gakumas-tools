# Gakumas Data Stage Effects

Effects of p-items, skill cards, and stages in gakumas-data are represented in a custom string format as described below.

## Format

A list of effects separated by `;` where each effect can specify a phase, conditions, and actions, separated by `,`.
Effects can have multiple conditions and actions.

```
phase,condition,action;phase,condition,condition,action,action,action
```

If an effect has no actions, its phase and conditions are applied to the next effect.

### Examples

ターン開始時、好調が 4 以上の場合、集中+4、好調+4 (ステージ内 1 回)
アクティブスキルカード使用時、好印象の 100%スコア上昇

```
at:startOfTurn,if:goodConditionTurns>=4,do:concentration+=4,do:goodConditionTurns+=4,limit:1;
at:activeCardUsed,do:score+=goodImpressionTurns
```

スキルカード使用時、好印象が3以上の場合、次のターンスキルカードを引く (ステージ内 1 回)
```
at:cardUsed,if:goodImpressionTurns>=3,limit:1;at:startOfTurn,do:drawCard,limit:1
```

## Phase

The phase of an effect indicates when it will be activated, marked with `at:`

### Example

ターン開始時

```
at:startOfTurn
```

| Phase                        | Representation                 |
| ---------------------------- | ------------------------------ |
| ステージ開始時               | `startOfStage`                 |
| ステージ開始後               | `afterStartOfStage`                 |
| ターン開始時                 | `startOfTurn`                  |
| ターン開始後                 | `afterStartOfTurn`                  |
| 次のターン/〇ターン後                 | `turn`                  |
| 〇ターンごとに               | `everyTurn`                    |
| スキルカード使用時           | `cardUsed`                     |
| アクティブスキルカード使用時 | `activeCardUsed`               |
| メンタルスキルカード使用時   | `mentalCardUsed`               |
| スキルカード使用後           | `afterCardUsed`                |
| アクティブスキルカード使用後 | `afterActiveCardUsed`          |
| メンタルスキルカード使用後   | `afterMentalCardUsed`          |
| ターン終了時                 | `endOfTurn`                    |
| 好印象の効果ターンが増加後   | `goodImpressionTurnsIncreased` |
| やる気が増加後               | `motivationIncreased`          |
| 好調の効果ターンが増加後     | `goodConditionTurnsIncreased`  |
| 集中が増加後                 | `concentrationIncreased`       |
| 体力が減少後                 | `staminaDecreased`             |
| スキルカードコストで強化状態を消費した時 | `buffCostConsumed` |
| 指針が変更した時 | `stanceChanged` |


## Condition

Conditions that must be met for the effect to activate, marked with `if:`

### Examples

好印象が 4 以上の場合

```
if:goodImpressionTurns>=4
```

使用スキルカードのレアリティが SSR の場合

```
if:cardRarity==SSR
```

使用スキルカードの入手元がプロデュースアイドルの場合

```
if:cardSourceType==pIdol
```

指針が全力の場合

```
if:isFullPower
```

ボーカルターンの場合

```
if:isVocalTurn
```

前のフェーズがカード処理の場合

```
if:parentPhase==processCard
```

## Action

State changes to execute, marked with `do:`

### Example

好印象の 200%分スコア上昇

```
do:score+=goodImpressionTurns*2
```

## Limit

Maximum number of times to activate an effect, marked by `limit:`

### Example

ステージ内 2 回

```
limit:2
```

## Growth target

Indicates which skill cards to grow in a growth effect, marked by `target:`

### Example

手札

```
target:hand
```

山札のパラメータ増加値+5

```
target:deck,do:g.score+=5
```

## State variables

| Variable                   | Representation            |
| -------------------------- | ------------------------- |
| 経過ターン数               | `turnsElapsed`            |
| 残りターン数               | `turnsRemaining`          |
| スキルカード使用回数       | `cardUsesRemaining`       |
| 最大体力                   | `maxStamina`              |
| 固定体力                   | `fixedStamina`            |
| 体力                       | `stamina`                 |
| ステージ中に消費した体力   | `consumedStamina`         |
| 固定元気                   | `fixedGenki`              |
| 元気                       | `genki`                   |
| 体力 (元気適用)            | `cost`                    |
| スコア                     | `score`                   |
| ステージ中使用したカード数 | `cardsUsed`               |
| ステージ中使用したアクティブカード数 | `activeCardsUsed`     |
| 好調                       | `goodConditionTurns`      |
| 絶好調                     | `perfectConditionTurns`   |
| 集中                       | `concentration`           |
| 好印象                     | `goodImpressionTurns`     |
| やる気                     | `motivation`              |
| 指針 | `stance` |
| 変更前の指針 | `prevStance` |
| 指針固定 | `lockStanceTurns` |
| 全力値 | `fullPowerCharge` |
| ステージ中の累計全力値 | `cumulativeFullPowerCharge` |
| 熱気 | `enthusiasm` |
| ステージ中強気になった回数 | `strengthTimes` |
| ステージ中温存になった回数 | `preservationTimes` |
| ステージ中全力になった回数 | `fullPowerTimes` |
| 消費体力減少               | `halfCostTurns`           |
| 消費体力増加               | `doubleCostTurns`         |
| 消費体力削減               | `costReduction`           |
| 消費体力追加               | `costIncrease`            |
| スキルカード追加発動       | `doubleCardEffectCards`   |
| 次に使用したスキルカードの消費体力を0にする | `nullifyCostCards` |
| 元気無効                   | `nullifyGenkiTurns`       |
| 低下状態無効               | `nullifyDebuff`           |
| 使用スキルカード強化前 ID  | `usedCardId`              |
| 使用スキルカード効果       | `cardEffects`             |
| 使用スキルカードの入手元   | `cardSourceType`          |
| 使用スキルカードのレアリティ | `cardRarity`            |
| 使用スキルカードのベース ID | `usedCardBaseId`         |
| 集中適用倍数               | `concentrationMultiplier` |
| やる気適用倍数             | `motivationMultiplier`    |
| 好調効果適用倍数 | `goodConditionTurnsMultiplier` |
| アクティブカード使用不可 | `noActiveTurns` |
| メンタルカード使用不可 | `noMentalTurns` |
| 不調 | `poorConditionTurns` |
| ターン内使用したカード数 | `turnCardsUsed` |
| 保留カード数 | `numHeldCards` |
| 除外カード数 | `numRemovedCards` |
| 前のフェーズ | `parentPhase` |
| 指針変更回数 | `stanceChangedTimes` |
| ボーカルターンかどうか | `isVocalTurn` |
| ダンスターンかどうか | `isDanceTurn` |
| ビジュアルターンかどうか | `isVisualTurn` |
| 指針が強気かどうか | `isStrength` |
| 指針が温存かどうか | `isPreservation` |
| 指針が全力かどうか | `isFullPower` |
| 好印象の増加量 | `goodImpressionTurnsDelta` |
| 集中の増加量 | `concentrationDelta` |
| 元気の増加量 | `genkiDelta` |


## Growth variables
| Variable                   | Representation            |
| -------------------------- | ------------------------- |
| スコア | `g.score` |
| スコア上昇回数 | `g.scoreTimes` |
| コスト値 | `g.cost` |
| 元気 | `g.genki` |
| 好調 | `g.goodConditionTurns` |
| 絶好調 | `g.perfectConditionTurns` |
| 集中 | `g.concentration` |
| 好印象 | `g.goodImpressionTurns` |
| やる気 | `g.motivation` |
| 全力値 | `g.fullPowerCharge` |
| 消費軽減 | `g.halfCostTurns` |
| 好印象分スコア | `g.scoreByGoodImpressionTurns` |
| やる気分スコア | `g.scoreByMotivation` |
| 元気分スコア | `g.scoreByGenki` |
| 指針段階 | `g.stanceLevel` |


## Non-assignment actions

| Action                                       | Representation                |
| -------------------------------------------- | ----------------------------- |
| スキルカードを引く                           | `drawCard`                    |
| 手札をすべてレッスン中強化                   | `upgradeHand`                 |
| 手札をすべて入れ替える                       | `exchangeHand`                |
| ランダムな強化済みスキルカードを、手札に生成 | `addRandomUpgradedCardToHand` |
| ランダムな手札 1 枚をレッスン中強化          | `upgradeRandomCardInHand`     |
| 山札か捨て札にある特定のスキルカードを手札に移動 | `moveCardToHand(cardId, exact)` |
| 除外にある特定のスキルカードを手札に移動 | `moveCardToHandFromRemoved(cardBaseId)` |
| 特定のスキルカードを保留に移動 | `holdCard(cardBaseId)` |
| このスキルカードを保留に移動 | `holdThisCard` |
| 手札を選択し、保留に移動 | `holdSelectedFromHand` |
| 山札を選択し、保留に移動 | `holdSelectedFromDeck` |
| 山札か捨て札を選択し、保留に移動 | `holdSelectedFromDeckOrDiscards` |
| スコア上昇量増加                             | `setScoreBuff(amount,turns)`  |
| 好印象増加量増加 | `setGoodImpressionTurnsBuff(amount,turns)` |
| 指針を変更 | `setStance(stance)` |

### Example

スコア上昇量増加 30% (5 ターン)
スコア上昇量増加 15%

```
do:setScoreBuff(0.3,5);
do:setScoreBuff(0.15)
```

## TTL

Time-to-live of an effect, in turns, marked by `ttl:`

### Example

1ターン有効

```
ttl:1
```

## Delay

Turns to delay an effect, marked by `delay:`

### Example

2ターン後

```
delay:1
```

### Group

Determines the order in which effects are activated. By default, all effects are in group 0, and activate in the order they are added. Effects with lower group activate earlier.

```
group:2
```
