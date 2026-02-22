import { StageLogic, Stage21Logic } from './stage_design';
import { IdolRoadEngine } from './engine';
import { Card, PItem } from './types';

export class KotoneStage21Logic extends Stage21Logic {
    stageId = 'stage_21_kotone';
    description = 'Fujita Kotone Stage 21 (Turn Effects + P-Items)';

    // Turn Effects (One-time triggers)
    // 3: Motivation >= 3 -> HP +6
    // 6: Motivation >= 8 -> HP +6
    // 9: Motivation >= 16 -> Score Up Amount +100% (Not easily implementable without modifier system, will log for now)
    // 11: Motivation >= 28 -> Move Exhaust (Cost>=4) to Deck Random
    // 14: Motivation >= 36 -> Genki +8 (Effect x3 = +24?) - "やる気効果を3倍適用" usually means "Apply 3x effect IF it depends on motivation"? 
    // Wait, the text says: "元気+8 (やる気効果を3倍適用)" -> "Genki +8 (Apply Motivation Effect x3)". 
    // In Gakumas, usually Genki gain is unaffected by Motivation unless specified. 
    // Maybe it means "The Genki gain is boosted by motivation * 3"? 
    // Or "This effect is treated as if Motivation was 3x"? 
    // Let's look at similar effects. "元気+8" is the base.
    // "やる気効果を3倍適用" -> Maybe standard motivation bonus to Genki/Score is tripled? 
    // Actually, usually "Genki" actions are NOT affected by motivation. 
    // But maybe this specific effect is? 
    // Let's assume for now it means "Genki +8" and we might need to clarify the "3x" part. 
    // Re-reading: "元気+8 (やる気効果を3倍適用)"
    // Often implies: Only for this calculation, current motivation is treated as 3x? 
    // OR: The Genki gain itself is multiplied? 
    // Let's stick to a simple interpretation or log it. 
    // Actually, in "Idol Road", maybe it means "Genki + 24"? 
    // Let's implement as Genki +8 for now and log the note.

    onTurnStart(engine: IdolRoadEngine): void {
        const turn = engine.turnsElapsed + 1; // turnsElapsed is 0-indexed in engine usually

        console.log(`[Stage Logic] Turn ${turn} Check...`);

        if (turn === 3) {
            if (engine.motivation >= 3) {
                engine.stamina = Math.min(100, engine.stamina + 6); // Cap at max Stamina?
                console.log("[Turn 3] Motivation >= 3 -> Recover 6 Stamina");
            }
        }
        if (turn === 6) {
            if (engine.motivation >= 8) {
                engine.stamina = Math.min(100, engine.stamina + 6);
                console.log("[Turn 6] Motivation >= 8 -> Recover 6 Stamina");
            }
        }
        if (turn === 9) {
            if (engine.motivation >= 16) {
                console.log("[Turn 9] Motivation >= 16 -> Score Up +100% (Not Implemented)");
            }
        }
        if (turn === 11) {
            if (engine.motivation >= 28) {
                // Move Exhaust (Cost >= 4) to Deck Random
                const targets = engine.getExhaust().filter(c => {
                    // We don't have cost in Card type yet, assuming simple check or 'consumption' logic?
                    // The requirements mentions "Cost >= 4". We need 'cost' in Card.
                    // For now, let's filter nothing or all if we can't check cost.
                    // TODO: Update Card type to include cost/stamina consumption value.
                    return true;
                });

                if (targets.length > 0) {
                    // Logic to move them.
                    // Engine needs a method for this.
                    // For CLI Phase 1, we can just log.
                    console.log(`[Turn 11] Motivation >= 28 -> Return ${targets.length} High-Cost cards to Deck (Logic Mock)`);
                }
            }
        }
        if (turn === 14) {
            if (engine.motivation >= 36) {
                const amount = 8; // Multiplier?
                engine.genki += amount;
                console.log(`[Turn 14] Motivation >= 36 -> Genki +${amount} (Note: 3x Motivation Effect not fully reimplemented)`);
            }
        }

        // P-Item Triggers (Turn Start)
        // e.g. "費用0円愛情MAX+": Turn Start, Mot >= 5 -> Genki +6 (Max 2 times)
        // We will execute P-Items here roughly.
        this.runPItems(engine, 'turnStart');
    }

    runPItems(engine: IdolRoadEngine, trigger: string, context?: any) {
        // Mock P-Item execution
        // We would iterate engine.pItems and check conditions
        const items = engine['pItems'] as PItem[];
        if (!items) return;

        items.forEach(item => {
            item.effects.forEach(effect => {
                if (effect.trigger === trigger) {
                    // Check Conditions
                    if (effect.conditions) {
                        if (effect.conditions.minMotivation !== undefined && engine.motivation < effect.conditions.minMotivation) return;
                        // Add other checks
                    }

                    // Check Limit
                    // We need state to track usage limits (e.g. limitPerStage).
                    // Engine or Item instance needs to track this.
                    // For Phase 1, we'll force limit check via logs or simple property on the item object if mutable.
                    // Assuming item object is mutable for this session.
                    if (effect.action.limitPerStage) {
                        const usedKey = `used_${trigger}_${effect.action.type}`;
                        if ((item as any)[usedKey] && (item as any)[usedKey] >= effect.action.limitPerStage) return;
                        (item as any)[usedKey] = ((item as any)[usedKey] || 0) + 1;
                    }

                    // Execute
                    console.log(`[P-Item] ${item.name} Triggered! (${effect.action.type} ${effect.action.value})`);

                    switch (effect.action.type) {
                        case 'recover_hp':
                            engine.stamina = Math.min(100, engine.stamina + effect.action.value);
                            break;
                        case 'add_genki':
                            engine.genki += effect.action.value;
                            break;
                        case 'add_motivation':
                            engine.motivation += effect.action.value;
                            break;
                        // ...
                    }
                }
            });
        });
    }
}
