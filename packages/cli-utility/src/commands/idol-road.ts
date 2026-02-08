import { CAC } from 'cac';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Card } from '../idol-road/types';
import { IdolRoadEngine } from '../idol-road/engine';
import { Database } from '../idol-road/db';

// Helper to load skill cards
const loadSkillCards = (): any[] => {
    const jsonPath = path.resolve(process.cwd(), '../gakumas-data/json/skill_cards.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`Skill cards not found at ${jsonPath}`);
        return [];
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
};

const mapToEngineCard = (memoryCardId: number, masterData: any[]): Card => {
    const cardData = masterData.find(c => c.id === memoryCardId);
    if (!cardData) {
        return {
            id: `unknown_${memoryCardId}`,
            originalId: memoryCardId,
            name: `Unknown(${memoryCardId})`,
            rarity: 'N',
            consumption: false
        };
    }

    // Determine consumption.
    // In Gakumas, "consumption" usually means it's removed after use if it has a limit,
    // OR if we define specific logic.
    // For Idol Road, let's assume SR/SSR logic from requirements implies consumption behavior.
    // Requirement said: "SR cards (consumable)" -> implies SRs are consumable?
    // Let's stick to the previous verified logic: SR = Consumable for the gimmick test.
    // BUT in real game, not all SRs are consumable.
    // User Requirement in Phase 1 said: "consumption=True cards move to exhaust".
    // And "Rarity Cross-Recovery" recovers SRs.
    // Let's incorrectly map SR as consumption=true for THIS SIMULATION to match the gimmick requirement
    // unless the card data says it has a limit.
    // Real data has "limit" field. If limit is number and > 0, strict logic says it's consumable.
    // But for Idol Road "Simulation", maybe the user wants to test the "Consumable SR" mechanic specifically.
    // I will look at 'limit' field. if limit exists, consumption = true.
    // ALSO, if usage count limit is handled by engine, we need to populate it.

    // For now, mapping 'limit' presence to 'consumption' flag used by our simple engine.
    const hasLimit = cardData.limit !== "" && cardData.limit !== undefined && cardData.limit !== null;

    return {
        id: `${cardData.id}_${Math.random().toString(36).substr(2, 5)}`,
        originalId: cardData.id,
        name: cardData.name,
        rarity: cardData.rarity,
        consumption: hasLimit, // Auto-detect from data
        type: cardData.type
    };
};

export const registerIdolRoadCommand = (cli: CAC) => {
    cli.command('idol-road [memoryId]', 'Run Idol Road Simulator (Interactive)')
        .action(async (memoryId) => {
            console.log("=== Idol Road Simulator: Interactive Mode ===\n");

            const db = new Database();
            await db.connect();

            if (!memoryId || memoryId === 'list') {
                console.log("No memory ID provided. Listing recent memories from DB:");
                const memories = await db.getRecentMemories(10);
                memories.forEach((m: any) => {
                    console.log(`- ID: ${m._id} | P-Idol: ${m.pIdolId} | Name: ${m.name || 'No Name'} | Created: ${m._id.getTimestamp()}`);
                });
                console.log("\nUsage: npm start -- idol-road <memoryId>");
                await db.close();
                return;
            }

            let deck: Card[] = [];
            const masterData = loadSkillCards();

            // Load Memory
            console.log(`Loading memory: ${memoryId}...`);
            const memory = await db.getMemory(memoryId);
            if (!memory) {
                console.error("Memory not found!");
                await db.close();
                return;
            }

            console.log(`Loaded Memory: ${memory.name} (P-Idol: ${memory.pIdolId})`);

            // Construct Deck
            // memory.skillCardIds: array of card IDs
            const cardIds = memory.skillCardIds || [];
            deck = cardIds.map((id: number) => mapToEngineCard(id, masterData));

            await db.close();

            const engine = new IdolRoadEngine(deck);
            console.log("\nSimulation Start!");
            engine.draw(3); // Initial hand
            engine.printState();

            // Interactive Loop
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: 'idol-road> '
            });

            rl.prompt();

            rl.on('line', (line) => {
                const parts = line.trim().split(' ');
                const cmd = parts[0];

                switch (cmd) {
                    case 'd':
                    case 'draw':
                        engine.draw(1);
                        engine.printState();
                        break;
                    case 'p':
                    case 'play':
                        const idx = parseInt(parts[1], 10);
                        if (isNaN(idx)) {
                            console.log("Usage: p <index> (0-based)");
                        } else {
                            engine.playCard(idx);
                            engine.printState();
                        }
                        break;
                    case 'e':
                    case 'end':
                        engine.endTurn();
                        engine.draw(3); // Draw 3 for next turn? Standard rule usually 3.
                        engine.printState();
                        break;
                    case 's':
                    case 'state':
                        engine.printState();
                        break;
                    case 'q':
                    case 'quit':
                    case 'exit':
                        rl.close();
                        break;
                    case 'help':
                        console.log("Commands:");
                        console.log("  d, draw      - Draw 1 card");
                        console.log("  p, play <n>  - Play card at hand index <n>");
                        console.log("  e, end       - End turn (discard hand, draw 3)");
                        console.log("  s, state     - Show current state");
                        console.log("  q, quit      - Exit");
                        break;
                    default:
                        console.log("Unknown command. Type 'help' for available commands.");
                        break;
                }
                rl.prompt();
            }).on('close', () => {
                console.log('Bye!');
                process.exit(0);
            });
        });
};
