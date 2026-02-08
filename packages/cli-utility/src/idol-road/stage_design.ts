import { Card } from './types';
import { IdolRoadEngine } from './engine';

/**
 * Interface for defining Stage-specific Logic (Gimmicks).
 * This allows us to swap logic easily for Stage 21, 22, etc.
 */
export interface StageLogic {
    stageId: string;
    description: string;

    // Hooks for Game Events
    onGameStart?(engine: IdolRoadEngine): void;
    onTurnStart?(engine: IdolRoadEngine): void;
    onCardPlayed?(engine: IdolRoadEngine, card: Card): void;
    onTurnEnd?(engine: IdolRoadEngine): void;
}

/**
 * Implementation for Stage 21-25 (based on current Note).
 * Logic: Rarity Cross-Recovery
 */
export class Stage21Logic implements StageLogic {
    stageId = 'stage_21';
    description = 'Playing 3 of one rarity recovers all exhausted cards of the other rarity.';

    // Internal State
    private ssrCount = 0;
    private srCount = 0;
    private maxTriggersPerType = 10;
    private ssrTriggerCount = 0;
    private srTriggerCount = 0;

    onCardPlayed(engine: IdolRoadEngine, card: Card): void {
        if (card.rarity === 'SSR') {
            this.handleSSRPlay(engine);
        } else if (card.rarity === 'SR') {
            this.handleSRPlay(engine);
        }
    }

    private handleSSRPlay(engine: IdolRoadEngine) {
        this.ssrCount++;
        if (this.ssrCount >= 3) {
            this.ssrCount = 0;
            if (this.ssrTriggerCount < this.maxTriggersPerType) {
                const recovered = engine.recoverAllExhaustedToBottom('SR');
                if (recovered > 0) {
                    this.ssrTriggerCount++;
                    console.log(`[STAGE 21 GIMMICK] 3 SSRs -> Recovered ${recovered} SRs.`);
                }
            }
        }
    }

    private handleSRPlay(engine: IdolRoadEngine) {
        this.srCount++;
        if (this.srCount >= 3) {
            this.srCount = 0;
            if (this.srTriggerCount < this.maxTriggersPerType) {
                const recovered = engine.recoverAllExhaustedToBottom('SSR');
                if (recovered > 0) {
                    this.srTriggerCount++;
                    console.log(`[STAGE 21 GIMMICK] 3 SRs -> Recovered ${recovered} SSRs.`);
                }
            }
        }
    }
}

// Example: Managing defined stages
export const STAGE_REGISTRY: Record<string, new () => StageLogic> = {
    '21': Stage21Logic,
    // '22': Stage22Logic...
};
