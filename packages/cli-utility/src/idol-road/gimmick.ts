import { Card } from './types';
import { IdolRoadEngine } from './engine';

export class StageGimmickObserver {
    private engine: IdolRoadEngine;
    private history: Card[] = [];

    private ssrCount = 0;
    private srCount = 0;
    private ssrTriggerCount = 0;
    private srTriggerCount = 0;

    constructor(engine: IdolRoadEngine) {
        this.engine = engine;
    }

    onCardPlayed(card: Card): void {
        this.history.push(card);
        // console.log(`[Gimmick] Observed card played: ${card.name} (${card.rarity})`);

        // Stage 21+ Logic: Rarity Cross-Recovery (Note Version)
        // 3 SSR used -> Recover ALL exhausted SR to bottom of deck
        // 3 SR used -> Recover ALL exhausted SSR to bottom of deck
        // Limit: 10 times per trigger type

        if (card.rarity === 'SSR') {
            this.ssrCount++;
            if (this.ssrCount >= 3) {
                this.ssrCount = 0;
                if (this.ssrTriggerCount < 10) {
                    const recovered = this.engine.recoverAllExhaustedToBottom('SR');
                    if (recovered > 0) {
                        this.ssrTriggerCount++;
                        console.log(`[GIMMICK] Used 3 SSRs -> Recovered ${recovered} SR cards to bottom of deck.`);
                    } else {
                        // console.log(`[GIMMICK] Used 3 SSRs -> No SR cards to recover.`);
                    }
                }
            }
        } else if (card.rarity === 'SR') {
            this.srCount++;
            if (this.srCount >= 3) {
                this.srCount = 0;
                if (this.srTriggerCount < 10) {
                    const recovered = this.engine.recoverAllExhaustedToBottom('SSR');
                    if (recovered > 0) {
                        this.srTriggerCount++;
                        console.log(`[GIMMICK] Used 3 SRs -> Recovered ${recovered} SSR cards to bottom of deck.`);
                    } else {
                        // console.log(`[GIMMICK] Used 3 SRs -> No SSR cards to recover.`);
                    }
                }
            }
        }
    }
}
