// @ts-ignore
import { CAC } from 'cac';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';
// @ts-ignore
import * as readline from 'readline';
import { IdolRoadStageEngine } from '../idol-road/engine-adapter';
// @ts-ignore
import { S, LOGGED_FIELDS, formatDiffField } from 'gakumas-engine/constants.js';
// @ts-ignore
import { SkillCards } from 'gakumas-data';
import { IdolRoadStage } from '../idol-road/types';

export const registerIdolRoadSimCommand = (cli: CAC) => {
    cli.command('idol-road-sim <stageId>', 'Run Deterministic Idol Road Simulator (POC)')
        .option('--deck <deckId>', 'Override fixed deck with a specific memory deck')
        .action(async (stageId, options) => {
            console.log(`=== Idol Road Deterministic Simulator POC ===\n`);

            // 1. Load Stage from JSON
            let idolRoadStagesPath = path.resolve(process.cwd(), '../gakumas-data/json/idol_road_stages.json');
            if (!fs.existsSync(idolRoadStagesPath)) {
                idolRoadStagesPath = path.resolve(process.cwd(), 'packages/gakumas-data/json/idol_road_stages.json');
            }
            if (!fs.existsSync(idolRoadStagesPath)) {
                idolRoadStagesPath = path.resolve(__dirname, '../../../../gakumas-data/json/idol_road_stages.json');
            }

            if (!fs.existsSync(idolRoadStagesPath)) {
                console.error(`Stage data not found at any locations. Tried: ${idolRoadStagesPath}`);
                return;
            }

            const jsonStages = JSON.parse(fs.readFileSync(idolRoadStagesPath, 'utf-8'));
            const stageDef = jsonStages.find((s: any) => s.id === stageId);

            if (!stageDef) {
                console.error(`Stage ID "${stageId}" not found in idol_road_stages.json`);
                console.log("Available stages:", jsonStages.map((s: any) => s.id).join(', '));
                return;
            }

            console.log(`Loaded Stage: ${stageDef.name}`);

            // 2. Initialize Engine
            const stageConfig: IdolRoadStage = stageDef.config || stageDef;
            if (!(stageConfig as any).engineConfig) {
                (stageConfig as any).engineConfig = stageConfig;
            }
            const engine = new IdolRoadStageEngine(stageConfig);
            let state = engine.getInitialState();
            state = engine.startStage(state);

            console.log("\nSimulation Start!");

            const printStatus = (s: any) => {
                console.log(`\n=== Turn ${s[S.turnsElapsed] + 1} / ${s[S.turnsRemaining] + s[S.turnsElapsed]} (${s[S.turnTypes][s[S.turnsElapsed]]}) ===`);
                console.log(`Score: ${Math.floor(s[S.score])} | Genki: ${Math.floor(s[S.genki])} | Stamina: ${Math.floor(s[S.stamina])}`);
                console.log(`Motivation: ${s[S.motivation]} | Weakness: ${s[1000] || 0}`);
                console.log(`Good Impression: ${s[S.goodImpressionTurns]} | Good Condition: ${s[S.goodConditionTurns]} | Concentration: ${s[S.concentration]}`);
            };

            const printHand = (s: any) => {
                console.log('\n--- Hand ---');
                s[S.handCards].forEach((cardIdx: number, i: number) => {
                    const cardRef = s[S.cardMap][cardIdx];
                    const cardData = SkillCards.getById(cardRef.id);
                    let costStr = '0';
                    if (cardData.cost && typeof cardData.cost === 'object') {
                        costStr = JSON.stringify(cardData.cost);
                    } else if (cardData.cost !== undefined) {
                        costStr = String(cardData.cost);
                    }
                    console.log(`[${i}] ${cardData.name} (Cost: ${costStr})`);
                });
                console.log(`Hand size: ${s[S.handCards].length}`);
            };

            printStatus(state);
            printHand(state);

            // 3. Interactive Loop
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: 'idol-road-sim> '
            });

            rl.prompt();

            rl.on('line', async (line) => {
                const parts = line.trim().split(' ');
                const cmd = parts[0];

                try {
                    switch (cmd) {
                        case 'p':
                        case 'play':
                            const idx = parseInt(parts[1], 10);
                            if (isNaN(idx) || idx < 0 || idx >= state[S.handCards].length) {
                                console.log("Usage: p <index> (0-based)");
                            } else {
                                const cardIdx = state[S.handCards][idx];
                                state = engine.useCard(state, cardIdx);
                                printStatus(state);
                                printHand(state);
                            }
                            break;
                        case 'e':
                        case 'end':
                            state = engine.endTurn(state);
                            printStatus(state);
                            printHand(state);
                            break;
                        case 's':
                        case 'state':
                            printStatus(state);
                            printHand(state);
                            break;
                        case 'q':
                        case 'quit':
                        case 'exit':
                            rl.close();
                            break;
                        case 'help':
                            console.log("Commands:");
                            console.log("  p, play <n>  - Play card at hand index <n>");
                            console.log("  e, end       - End turn");
                            console.log("  s, state     - Show current state");
                            console.log("  q, quit      - Exit");
                            break;
                        default:
                            console.log("Unknown command. Type 'help' for available commands.");
                            break;
                    }
                } catch (e) {
                    console.error("Error during execution:", e);
                }
                if (cmd !== 'q' && cmd !== 'quit' && cmd !== 'exit') {
                    rl.prompt();
                }
            }).on('close', () => {
                console.log('Bye!');
            });
        });
};
