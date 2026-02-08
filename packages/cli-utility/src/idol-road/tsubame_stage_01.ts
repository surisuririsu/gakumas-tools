import { StageLogic } from './stage_design';
import { IdolRoadEngine } from './engine';

export class TsubameStage01Logic implements StageLogic {
    stageId = 'stage_01_tsubame';
    description = 'Amaya Tsubame Stage 01';

    // Buff tracking (Stage-specific)
    hasTurn4Cheer = false;
    hasTurn9Cheer = false;

    onTurnStart(engine: IdolRoadEngine): void {
        const turn = engine['turnCount'] + 1;
        console.log(`[Stage Logic] Turn ${turn} Check...`);

        // Turn 4 Cheer: Mot >= 5 -> Grant "Turn End Mot +2"
        if (turn === 4) {
            if (engine.motivation >= 5) {
                console.log("[Turn 4] Motivation >= 5 -> Cheer: Turn End Mot +2 Granted");
                this.hasTurn4Cheer = true;
            }
        }

        // Turn 7 Trouble: Mot <= 17 -> Bad Mood 5 turns
        if (turn === 7) {
            if (engine.motivation <= 17) {
                console.log("[Turn 7] Motivation <= 17 -> Trouble: Bad Mood (5 turns)");
                // Implement Bad Mood logic if needed (usually prevents Mot/Genki gains?)
            }
        }

        // Turn 9 Cheer: Genki >= 75 -> Grant "Turn End Score += Genki * 1.0"
        if (turn === 9) {
            if (engine.genki >= 75) {
                console.log("[Turn 9] Genki >= 75 -> Cheer: Turn End Score += Genki");
                this.hasTurn9Cheer = true;
            }
        }
    }

    onTurnEnd(engine: IdolRoadEngine): void {
        // Apply Cheer Effects
        if (this.hasTurn4Cheer) {
            console.log("[Cheer] Turn End: Motivation +2");
            engine.motivation += 2;
        }

        if (this.hasTurn9Cheer) {
            const scoreAdd = engine.genki;
            console.log(`[Cheer] Turn End: Score += ${scoreAdd} (from Genki)`);
            // Score is not tracked on engine yet? Engine needs score property.
            // If not available, just log.
        }
    }
}
