// @ts-ignore
import { StageEngine } from 'gakumas-engine';
// @ts-ignore
import Executor from 'gakumas-engine/engine/Executor.js';
// @ts-ignore
import { S, TOKEN_REGEX } from 'gakumas-engine/constants.js';
import pItemsData from 'gakumas-data/json/p_items.json';
import { IdolRoadStage } from './types';
// @ts-ignore
import CardManager from 'gakumas-engine/engine/CardManager.js';

// Constants for P-Item patching
const FUSAWASHII_IDS = [118, 119, 356, 357];
const WEAKNESS_IDX = 1000;

class IdolRoadExecutor extends Executor {
    constructor(engine: any) {
        super(engine);
    }

    resolveGenki(state: any, genki: number) {
        // @ts-ignore
        const oldGenki = state[S.genki];
        // @ts-ignore
        super.resolveGenki(state, genki);
        const diff = state[S.genki] - oldGenki;
        console.log(`[Adapter] resolveGenki: ${oldGenki} -> ${state[S.genki]} (Diff: ${diff})`);
        const weakness = state[WEAKNESS_IDX] || 0;

        if (diff > 0 && weakness > 0) {
            const finalGain = Math.max(0, diff - weakness);
            state[S.genki] = oldGenki + finalGain;
        }
    }

    executeAction(state: any, action: any, card?: any) {
        console.log(`[Adapter] Executing: ${JSON.stringify(action)} (Card: ${card})`);
        const tokens = action; // action is already tokenized array or string
        // Check for weakness+=X
        // config.effects conversion splits by TOKEN_REGEX
        // so tokens is string[]
        if (tokens.length >= 1 && tokens[0] === 'weakness') {
            if (tokens[1] === '+=' && tokens.length === 3) {
                const val = parseInt(tokens[2]);
                console.log(`[Adapter] Weakness += ${val}`);
                state[WEAKNESS_IDX] = (state[WEAKNESS_IDX] || 0) + val;
                return;
            }
        }
        super.executeAction(state, action, card);
    }
}

function formatEffect(effect: any) {
    if (effect.conditions) {
        effect.conditions = effect.conditions.map((x: string) =>
            x.split(TOKEN_REGEX).map(t => t.trim()).filter((t: string) => t !== '')
        );
    }
    if (effect.actions) {
        effect.actions = effect.actions.map((x: string) =>
            x.split(TOKEN_REGEX).map(t => t.trim()).filter((t: string) => t !== '')
        );
    }
    return effect;
}

export class IdolRoadStageEngine extends StageEngine {
    private idolRoadStage: IdolRoadStage;
    executor!: IdolRoadExecutor;
    cardManager!: CardManager;

    // inherited from StageEngine but might be hidden if type resolving fails
    startStage!: (state: any) => any;
    useCard!: (state: any, card: any) => any;
    endTurn!: (state: any) => any;

    constructor(stage: IdolRoadStage) {
        const config = IdolRoadStageEngine.convertConfig(stage);
        super(config, []);
        this.idolRoadStage = stage;
        this.executor = new IdolRoadExecutor(this);

        // Override CardManager to support deterministic behavior
        const originalChangeIdol = this.cardManager.changeIdol.bind(this.cardManager);
        this.cardManager.changeIdol = (state: any) => {
            originalChangeIdol(state);
            if (this.idolRoadStage.engineConfig.fixedDeck) {
                // If fixedDeck is provided, we want to respect the order.
                // CardManager.changeIdol shuffles, so we re-sort back to the original order.
                // The indices in deckCards correspond to the order in config.idol.cards.
                // To have cards drawn in the order of fixedDeck [A, B, C, ...],
                // since CardManager uses pop(), we need deckCards to be [..., C, B, A].
                const numCards = state[S.deckCards].length + state[S.handCards].length + state[S.discardedCards].length + state[S.removedCards].length;
                const newDeck: number[] = [];
                for (let i = 0; i < numCards; i++) {
                    newDeck.push(i);
                }
                state[S.deckCards] = newDeck.reverse();
                state[S.handCards] = [];
                state[S.discardedCards] = [];
                state[S.removedCards] = [];
                console.log("[IdolRoadStageEngine] Deterministic deck initialized (no shuffle).");
            }
        };

        // Support fixed draws if provided
        const originalDrawCard = this.cardManager.drawCard.bind(this.cardManager);
        let cardsDrawnThisTurnCount = 0;
        let lastTurnElapsed = -1;

        this.cardManager.drawCard = (state: any) => {
            const fixedDraws = this.idolRoadStage.engineConfig.fixedDraws;
            const turn = state[S.turnsElapsed] + 1;

            // Reset counter on new turn
            if (state[S.turnsElapsed] !== lastTurnElapsed) {
                cardsDrawnThisTurnCount = 0;
                lastTurnElapsed = state[S.turnsElapsed];
            }

            if (fixedDraws && fixedDraws[String(turn)]) {
                const turnDraws = fixedDraws[String(turn)];
                if (cardsDrawnThisTurnCount < turnDraws.length) {
                    const targetCardId = String(turnDraws[cardsDrawnThisTurnCount]);

                    // Find card in deck
                    const deck = state[S.deckCards];
                    let targetIdx = -1;
                    for (let i = 0; i < deck.length; i++) {
                        const cardRef = state[S.cardMap][deck[i]];
                        if (String(cardRef.id) === targetCardId) {
                            targetIdx = i;
                            break;
                        }
                    }

                    if (targetIdx !== -1) {
                        // Move target card to the end of deckCards so pop() picks it
                        const cardIdx = deck.splice(targetIdx, 1)[0];
                        deck.push(cardIdx);
                        console.log(`[Adapter] Forcing draw of card ${targetCardId} for turn ${turn} (Draw #${cardsDrawnThisTurnCount + 1})`);
                    } else {
                        console.warn(`[Adapter] Could not find card ${targetCardId} in deck for turn ${turn}`);
                    }
                    cardsDrawnThisTurnCount++;
                }
            }
            originalDrawCard(state);
        };
    }

    static convertConfig(stage: IdolRoadStage): any {
        // 1. Gimmick to Effect Conversion
        const effects = (stage.gimmicks || []).map(g => {
            const phase = g.trigger === 'turnEnd' ? 'endOfTurn' : 'startOfTurn';
            let conditionStrings: string[] = [];
            if (g.condition && g.condition !== 'always') {
                conditionStrings = g.condition.split('&&').map(c => c.trim());
            }

            return formatEffect({
                phase: phase,
                conditions: conditionStrings,
                actions: [g.action],
                source: { type: 'stage', id: 'gimmick' }
            });
        });

        // 2. Identify P-Items and Patch ...
        const pItemIds = stage.pItemIds || [];
        const patchedPItemIds: number[] = [];
        const manualEffects: any[] = [];

        pItemIds.forEach(id => {
            if (FUSAWASHII_IDS.includes(Number(id))) {
                // Manually add the patched effect
                const originalItem = pItemsData.find((p: any) => p.id == id);
                if (originalItem) {
                    const isPlus = originalItem.name.includes('+');
                    const motGain = isPlus ? 6 : 4;
                    const genkiGain = isPlus ? 28 : 20;

                    manualEffects.push(formatEffect({
                        phase: 'motivationIncreased',
                        conditions: [
                            'genki>=7',
                            'parentPhase==processCard'
                        ],
                        actions: [
                            `motivation+=${motGain}`,
                            `genki+=${genkiGain}`,
                            'fixedStamina-=2'
                        ],
                        limit: 2,
                        source: { type: 'pItem', id: id }
                    }));
                }
            } else if (Number(id) === 358) { // Sleeping Comfort+
                manualEffects.push(formatEffect({
                    phase: 'motivationIncreased',
                    conditions: ['isDanceTurn'],
                    actions: [
                        'setMotivationBuff(0.5, 2)',
                        'setGoodImpressionTurnsEffectBuff(0.5, 2)',
                        'motivation+=1'
                    ],
                    source: { type: 'pItem', id: id }
                }));
            } else if (Number(id) === 82) { // Ramen
                manualEffects.push(formatEffect({
                    phase: 'startOfTurn',
                    conditions: ['turnsElapsed==2'], // T3
                    actions: ['cardUsesRemaining+=1'],
                    source: { type: 'pItem', id: id }
                }));
            } else if (Number(id) === 79) { // Luggage
                manualEffects.push(formatEffect({
                    phase: 'startOfTurn',
                    conditions: ['turnsElapsed==0'], // T1
                    actions: ['cardUsesRemaining+=1'],
                    source: { type: 'pItem', id: id }
                }));
            } else {
                patchedPItemIds.push(Number(id));
            }
        });

        // 3. Build Cards with Customizations
        const engineConfig = stage.engineConfig || (stage as any);
        const userDeck = engineConfig.fixedDeck || [];
        const cards = userDeck.map((idStr: any) => {
            const id = String(idStr); // Ensure string key lookup
            const customizations = stage.cardCustomizations?.[id];
            if (customizations) {
                console.log(`[Adapter] Attaching customizations to card ${id}:`, JSON.stringify(customizations));
                return { id: Number(id), customizations: customizations };
            }
            return { id: Number(id) };
        });

        // Combine gimmicks and manual effects
        const allEffects = [...effects, ...manualEffects];

        return {
            idol: {
                params: {
                    ...stage.params,
                    stamina: engineConfig.stamina || 35
                },
                cards: cards,
                pItemIds: patchedPItemIds,
                plan: stage.plan
            },
            stage: {
                type: 'idolRoad',
                turnCount: engineConfig.maxTurns || 12,
                turnCounts: { vocal: 0, dance: 0, visual: 0 },
                firstTurns: { vocal: 0, dance: 0, visual: 0 },
                criteria: { vocal: 0, dance: 0, visual: 0 },
                typeMultipliers: {
                    vocal: (stage.params?.vocal || 100) / 100,
                    dance: (stage.params?.dance || 100) / 100,
                    visual: (stage.params?.visual || 100) / 100
                },
                effects: allEffects
            },
            typeMultipliers: {
                vocal: (stage.params?.vocal || 100) / 100,
                dance: (stage.params?.dance || 100) / 100,
                visual: (stage.params?.visual || 100) / 100
            },
            defaultCardIds: []
        };
    }

    // Override to enforce our deck and turn types
    getInitialState(skipEffects = false) {
        const state = super.getInitialState(skipEffects);
        state[WEAKNESS_IDX] = 0;

        // 1. Override Turn Types
        if (this.idolRoadStage.engineConfig.turnTypes) {
            state[S.turnTypes] = this.idolRoadStage.engineConfig.turnTypes;
        }

        // Fix Motivation Multiplier for Logic/Idol Road (Genki += Mot * 1)
        console.log(`[Adapter] Initial Motivation Multiplier: ${state[S.motivationMultiplier]}`);
        state[S.motivationMultiplier] = 1;

        return state;
    }
}
