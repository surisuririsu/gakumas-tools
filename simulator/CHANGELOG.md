# Contest Simulator Changelog

All notable changes to the contest simulator will be documented in this file.
Dates are based on Eastern Time Zone.

## 2024-11-27

### Added

- Preview of skill card and p-item from supports in WNWW Ume gacha

### Changed

- Updated simulator strategy to improve accuracy of anomaly (slightly), and special case for chochoinochoi (temporary)

## 2024-11-23

### Added

- Preview of White Night! White Wish! p-idols

### Fixed

- Trigger order of season 13 stage 2 effect (should activate later than other startOfTurn effects)

### Changed

- Updated first-turn rates of season 13
- Added support for flat-criteria bonus in season 13 score bonus calculation

## 2024-11-21

### Added

- Preview of contest season 13

## 2024-11-19

### Changed

- Adjusted simulator strategy for anomaly

## 2024-11-18

### Fixed

- Prevent duplicate growth of cards when multiple copies are in the deck

## 2024-11-17

### Fixed

- Nullify cost cards was incorrectly applied to non-stamina cost
- Stance change event was incorrectly triggered when increasing stance level

### Changed

- Adjusted simulator strategy for anomaly

## 2024-11-16

### Added

- Partial implementation of plan Anomaly
- R, SR, SSR Sena
- New skill cards for Plv up to 60
- New gacha and event supports

## 2024-11-08

### Changed

- Adjusted simulator strategy to improve accuracy. (remove action depth limit, include card upgrade effect in evaluation, adjust weighting of score and continuous effects)

## 2024-11-06

### Changed

- Adjusted simulator strategy to improve accuracy by ~6% (limit action depth to 3, allow skip as a possible future action when no cards are playable, adjust weighting of card continuous effects, double card effects, and score).

## 2024-11-05

### Added

- Select pickup gacha skill cards (Hokahoka Yakiimo, Kou kai......?)

## 2024-10-30

### Added

- Contest season 12 preview

## 2024-10-29

### Fixed

- Round stamina numbers down (i.e. round consumed stamina up) when applying half cost

## 2024-10-27

### Added

- 古今東西ちょちょいのちょい Saki and supports
- Animate event stages

### Fixed

- Default cards in animate event

## 2024-10-20

### Added

- Preview of Kokontouzai Chochoinochoi Saki

## 2024-10-19

### Added

- Preview of contest season 11

## 2024-10-18

### Changed

- Updated L.U.V Rinami cards and items

## 2024-10-17

### Added

- Preview of L.U.V Rinami

## 2024-10-14

### Added

- Hatsukoi Mao, Sumika, Hiro

## 2024-10-10

### Changed

- Adjusted simulator strategy to improve accuracy

## 2024-10-09

### Fixed

- Effect and type of 切れた鼻緒が結んだ絆

### Changed

- Adjusted simulator strategy to improve accuracy, mainly by evaluating phase effects added (to fix hakusen vs dreamer), and adjusting weighting of good condition and concentration

## 2024-10-07

### Added

- Preview of Halloween Hiro gacha

### Fixed

- Effect activation conditions for cardUsed phases should be evaluated on pre-cost state

## 2024-10-05

### Fixed

- Contest season 10 turn counts
- Effects added at everyTurn phase should not be protected from EOT decrement
- Edge case for heuristic strategy when no recommended effect can be inferred

## 2024-10-03

### Added

- Contest season 10 preview

### Fixed

- まだ見ぬ世界へ to trigger later than other startOfTurn effects

## 2024-10-01

### Added

- Median score in simulator result

### Fixed

- Order of phase effect triggering

### Changed

- Recommended effect multipliers for good condition, concentration, good impression
- Score scaling in heuristic strategy
- Evaluation of stamina and score in heuristic strategy

## 2024-09-27

### Added

- Upgraded versions of 仮装狂騒曲 China and Temari

### Fixed

- Conditions being evaluated on updated state when multiple effects
- Limit hand size to 5
- Decrement TTL correctly at end of turn

## 2024-09-25

### Fixed

- Simulator strategy looking at wrong effects due to order sorting
- Simulator strategy not accounting for effects added when additional actions added

### Changed

- Recommended effect multipliers for concentration, goodImpressionTurns, motivation
- Evaluation of effects, genki, good condition, good impression, motivation, double cost turns, score

## 2024-09-20

### Fixed

- Type multipliers calculation to use maximum 1800 params

### Changed

- Evaluation of effects, and score for concentration type

## 2024-09-19

### Fixed

- Permanent score buffs expiring at end of turn

### Changed

- Recommended effect multiplier for concentration
- Evaluation of concentration, motivation, genki, score
- Updated with new cards/items from Mao gacha
- Updates to idoldamashii and shikirinaoshi

## 2024-09-18

### Added

- Contest season 9 stages (turn counts unknown)
- Feel Jewel Dream Mao
- Toroketa jikan

## 2024-09-15

### Changed

- Use same frequency estimate for all phases in card evaluation
- Recommended effect multipliers for good condition, concentration, good impression
- More accurate estimate of average type multiplier
- Evaluation of genki, good condition, perfect condition

## 2024-09-14

### Changed

- Consider other cards in the current hand when evaluating extra actions
- Recommended effect multipliers for good condition, concentration, and motivation
- Consider stamina when evaluating cards
- Evaluation of genki, good condition, perfect condition, concentration, and motivation
- Consider remaining turns in evaluation of half cost and double cost effects

### Removed

- Strategy update preview page for manual testing

## 2024-09-12

### Added

- Strategy update preview page for manual testing

## 2024-09-10

### Added

- Onsen China

## 2024-09-09

### Added

- Loadout history

### Fixed

- Effects added at start of turn no longer marked fresh

### Changed

- Mark unusable cards as unusable instead of -Infinity evaluation to avoid confusion

## 2024-09-06

### Added

- Skill card 切れた鼻緒が結んだ絆

## 2024-09-04

### Added

- Contest season 8 stages
- Show snapshot of effects in game state when user clicks ellipsis on hand log

### Fixed

- Stamina decrease trigger (affects 勝ちへのこだわり)

### Changed

- Combine one turn score buffs and permanent score buffs into a common format that tracks and decrements turn count
- Updated Kafe simulator URL to use updated API

## 2024-09-03

### Added

- Logging of effects set by p-items or cards in simulator logs

### Fixed

- Execution order of effects (score increases after buffs)

## 2024-09-02

### Added

- Preview of contest season 8 stages

### Changed

- Evaluation of extra actions considers total turn count
- Don't consider stamina in card evaluation

## 2024-08-31

### Added

- Shoshin Lilja, China, and Rinami
- Onsen Rinami

## 2024-08-29

### Changed

- Evaluation of effects using generic estimated value instead of fully simulating, improving performance
- Evaluation of genki

## 2024-08-28

### Added

- Memory selector modal in loadout skill card groups

## 2024-08-27

### Changed

- Assign value to extra actions only when 1 action remaining

## 2024-08-26

### Fixed

- Errors when deck and discards are empty when drawing card

### Changed

- Evaluation of extra actions

## 2024-08-24

### Changed

- Recommended effect multipliers for concentration and motivation
- Evaluation of extra actions, cards in hand, cards removed, stamina, genki, half cost turns

## 2024-08-23

### Added

- Graph average values of stats at the start of each turn
- Graph distribution in box plot

### Changed

- Frequency estimates of each game phase for evaluation of effects
- Recommended effect multipliers for good condition and concentration

## 2024-08-21

### Added

- Hibi China

### Fixed

- Order of operations when evaluating expressions in effects

## 2024-08-20

### Fixed

- Set initial value of `nullifyDebuff` to avoid `NaN` when operating on it
- Deck shuffling
- Don't apply concentration to non-positive score changes
- Fixed stamina changes for cards with stamina increase effects
- Limit for お嬢様の晴れ舞台, ワンモアステップ, 本気の趣, 距離感

## 2024-08-19

### Added

- Contest season 7 stages
- Cost increase effect

### Fixed

- log(0) in heuristic strategy when stamina is 0
- Apply cost reduction to direct stamina cost
- Use type multipliers when generating Kafe simulator URL

## 2024-08-18

### Added

- Stage customization

## 2024-08-17

### Fixed

- Generate random turn order on every run
- Perfect conditon effect

## 2024-08-15

### Added

- Support bonus

## 2024-08-14

### Fixed

- Miwaku no performance effect limit

## 2024-08-12

### Fixed

- Reset card uses remaining at end of turn
- Minus operator
- Edge case when card effect has no action
- Kamurogiku Kotone recommended effect

## 2024-08-11

### Changed

- Set up web workers on mount to improve performance

## 2024-08-10

### Added

- Kamurogiku Kotone
- Ubugoe Saki, Temari, Kotone

### Changed

- Parallelize simulation runs using web workers

## 2024-08-09

### Added

- Simulator logs
- Heuristic strategy

### Fixed

- Type of ポーズの基本
- Effect of 国民的アイドル
- Effect of なに聴いてるの？
- Effect of はじける水しぶ
- Effects of contest stages 1-2, 4-1, 5-1, 6-1

## 2024-08-08

### Added

- Simulator implementation
- Distribution plot
