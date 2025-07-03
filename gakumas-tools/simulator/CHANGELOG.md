# Contest Simulator Changelog

All notable changes to the contest simulator will be documented in this file.
Dates are based on Eastern Time Zone.

## 2025-07-03

### Added

- Season 27 preview

## 2025-06-29

### Changed

- Updated CM Misuzu

## 2025-06-27

### Added

- Preview of CM Misuzu

## 2025-06-19

### Changed

- Updated score multipliers for season 26
- Updated Love & Joy Sumika

## 2025-06-17

### Added

- Slider for number of runs to simulate
- Preview of contest season 26
- Preview of Love & Joy Sumika

## 2025-06-08

### Added

- Preview of HotW Lilja

## 2025-06-02

### Changed

- Contest season 25 turn counts and probabilities, parameter bonus calculation (incomplete)

## 2025-06-02

### Added

- Preview of contest season 25

## 2025-05-28

### Added

- Howling China and Rinami
- New p-items

## 2025-05-26

### Fixed

- Simulator strategy skipping evaluation of new effects

### Changed

- Adjusted evaluation of genki
- Reduced search depth

## 2025-05-25

### Added

- Preview of Howling over the World China

## 2025-05-24

### Fixed

- Stamina cost growth incorrectly applying to all types of cost

## 2025-05-23

### Fixed

- Held cards over limit (2) getting permanently removed instead of discarded

## 2025-05-19

### Fixed

- Genki customization for Yumeiro Lip

## 2025-05-18

### Added

- Skill cards from the N.I.A Master update

## 2025-05-16

### Added

- Preview of contest season 24
- P-item from event

### Changed

- Updated Misuzu p-items and skill cards

## 2025-05-15

### Added

- Preview of Misuzu

### Fixed

- Effect of Ano Hi no Vinyl-gasa should trigger before drawing cards

## 2025-05-01

### Added

- Unupgraded versions of Ameagari no Iris

### Changed

- Keep enthusiasm bonus after preservation effect

## 2025-04-30

### Added

- Preview of contest season 23

### Changed

- Debuff recovery to remove debuffs instead of decrementing

## 2025-04-28

### Added

- Preview of Ameagari no Iris

## 2025-04-22

### Changed

- Unupgraded versions of Our Chant Sena p-item and skill card

## 2025-04-21

### Added

- Preview of Our Chant Sena

## 2025-04-14

### Added

- Preview of contest season 22

### Fixed

- Effect of taisen onegaishimasu!
- Effect of chiisana ohisama
- Full power charge consumed when stance locked

## 2025-04-10

### Added

- Sakura photograph Saki and 3-1 event support

## 2025-04-01

### Added

- Sakura photograph Lilja and Sumika

### Fixed

- Order of conditions for Pcchi effect activation

## 2025-03-31

### Added

- Preview of 夢へのスタートライン

## 2025-03-29

### Added

- Preview of contest season 21

### Changed

- Prevent concentration from being negative outside of cost calculation

## 2025-03-27

### Added

- Preview of Sakura Photograph Lilja and Sumika

### Changed

- Evaluation of card uses remaining in contest strategy

## 2025-03-22

### Fixed

- Effect of Yumeiro Lip

## 2025-03-21

### Added

- Kyokkou Lilja
- New skill cards for Plv > 60

## 2025-03-20

### Added

- Preview of kyokkou lilja

### Changed

- Adjusted evaluation of genki, concentration, and perfect condition

## 2025-03-18

### Fixed

- Modified season 20 stage 2 effect condition to include parent phase check

## 2025-03-12

### Added

- Preview of contest season 20

### Fixed

- Effect for おてつき注意 should only last 5 turns (not 5 times)

## 2025-03-10

### Fixed

- Bug that caused effect to be skipped when the effect set prior to it had no actions (yukidokeni mao p-item for example)

## 2025-03-09

### Added

- Yukidokeni Mao

### Fixed

- Slow set operations for determining growth targets

## 2025-03-01

### Fixed

- Bug that caused p-items to not be resettable
- Fixed errors on memories page

## 2025-02-28

### Added

- Indication of removed duplicate skill cards
- Indication of mismatched idol, pIdol, plan

### Fixed

- Bugs related to customization-counting, which may have caused incorrect duplicate card removal or application of customizations
- Fix bug that caused addRandomCardToHand effect to set the incorrect baseId
- Fix bug that caused customizations to be applied to wrong card when changing card after picking customizations in entity picker modal

## 2025-02-27

### Added

- Yukidokeni Temari and China

## 2025-02-26

### Added

- Contest season 19

### Fixed

- Bug that caused card effects from customizations not to be considered in cardEffect trigger conditions

## 2025-02-22

### Added

- Preview of Yukidokeni Temari and China

### Fixed

- 3-stage score growth customization did not correctly apply stage 3 growth effect

## 2025-02-18

### Fixed

- Bug that caused card to not be moved to hand by effects in some cases when card occurs multiple times in deck and one is already in hand

## 2025-02-13

### Added

- Happy Millefeuille Sena

### Fixed

- Limit for endOfTurn effects that are set by skill cards

## 2025-02-10

### Changed

- Updated type multipliers for season 18

## 2025-02-07

### Added

- Preview of contest season 18

### Changed

- Adjusted weighting of effects, concentration

## 2025-01-31

### Changed

- Update Happy Millefeuille Hiro and Rinami
- Adjust evaluation of growth and effects by simulator strategy

## 2025-01-30

### Added

- Preview of Happy Millefeuille Hiro and Rinami

### Fixed

- Evaluation of growth and effects by simulator strategy

## 2025-01-26

### Changed

- Updated contest season 17

## 2025-01-24

### Fixed

- A bug that caused customized cards that should be drawn on turn 1 to not be draw in some cases
- A bug that caused increase/decrease trigger effects to be activated when they shouldn't be

## 2025-01-23

### Added

- Contest season 17 preview

## 2025-01-17

### Changed

- Increased evaluation of genki and motivation in simulator strategy

## 2025-01-15

### Added

- Campus mode vol 4

## 2025-01-11

### Fixed

- Increased param cap for season 16 onward

## 2025-01-09

### Changed

- Strategy for selecting card to hold
- Color-coded customization counts
- Updated season 16 contest

### Fixed

- Bug that caused not all held cards to be added to hand when entering full power stance
- Bug that caused infinite recursion when evaluating cards to hold

## 2025-01-08

### Added

- Campus mode vol. 3
- Preview of season 16 contest

## 2025-01-04

### Added

- Last missing effect for おアツい視線

## 2025-01-01

### Added

- Campus mode!! vol.2

## 2024-12-31

### Fixed

- Fixed hitokokyuu customizations

## 2024-12-30

### Added

- Customizations for a few more support cards

## 2024-12-29

### Fixed

- Customized skill cards were not prioritized over uncustomized cards when deduping

## 2024-12-28

### Added

- Support for most customizations

### Fixed

- An error when loading memories from db without customizations
- An error that enabled nullify debuff effect to unlock stance during full power

## 2024-12-26

### Added

- Support for customizations on sense R and SSR, logic SSR skill cards

## 2024-12-25

### Added

- Preview of Campus mode!! vol.1
- Preview of customizations seen in press articles
- Update Campus mode!! vol.1

## 2024-12-22

### Added

- Preview of contest season 15

### Changed

- Turn counts and first turn rates of S15 preview

## 2024-12-21

### Changed

- Adjusted simulator strategy

## 2024-12-20

### Fixed

- Fix effect of みんなの憧れ
- Fix inference of recommended effect from skill cards

## 2024-12-19

### Added

- Basic support for skill card customization

## 2024-12-18

### Changed

- Performance enhancements

## 2024-12-17

### Added

- Skill cards and p-items from Kakushitawatashi gacha

## 2024-12-15

### Fixed

- Growth condition of 頂点へ

## 2024-12-13

### Fixed

- Timing of delayed skill card effects

## 2024-12-12

### Added

- Preview of カクシタワタシ sumika

## 2024-12-11

### Fixed

- Effect and timing of きみと分け合う夏

## 2024-12-09

### Changed

- Updated skill cards and p-items for White Night! White Wish! Lilja

## 2024-12-08

### Added

- Preview of skill cards and p-items from White Night! White Wish! Lilja gacha

## 2024-12-05

### Added

- Preview of season 14 contest

## 2024-11-28

### Changed

- Updated skill card and p-item from supports in WNWW Ume gacha

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
