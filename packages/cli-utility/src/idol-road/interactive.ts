// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';
// @ts-ignore
import { cac } from 'cac';
// @ts-ignore
import * as readline from 'readline';
import { IdolRoadStageEngine } from './engine-adapter';
// @ts-ignore
import { S, LOGGED_FIELDS, formatDiffField } from 'gakumas-engine/constants.js';
// @ts-ignore
import { SkillCards } from 'gakumas-data';
import { IdolRoadStage } from './types';

// Env loading (preserved)
const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../../gakumas-tools/.env.local'),
    path.resolve(process.cwd(), '../../gakumas-tools/local-scripts/.env.local'),
    path.resolve(process.cwd(), '../gakumas-tools/gakumas-tools/.env.local') // Fallback for old structure if any
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) process.env[key] = val;
            }
        });
        break;
    }
}

const cli = cac();

// Global State
let engine: IdolRoadStageEngine;
let state: any;
let stageDef: IdolRoadStage;

// Helper to print new logs
let lastLogIndex = 0;
function printLogs(s: any) {
    const logs = s[S.logs] || [];
    if (logs.length > lastLogIndex) {
        for (let i = lastLogIndex; i < logs.length; i++) {
            const log = logs[i];
            // Format log: [Phase] Message (args)
            // Or just dump json? formatting is nicer.
            // Log structure: { type: string, args: object }
            // e.g. { type: 'startTurn', args: { num: 1, ... } }

            // Simple formatter
            let msg = `[${log.type}]`;
            if (log.args) {
                // Formatting specific types
                if (log.type === 'diff') {
                    // Too verbose? "diff field: prev -> next"
                    // Only log interesting headers
                } else {
                    msg += ` ${JSON.stringify(log.args)}`;
                }
            }
            // Debug logs silenced for clean output
            // if (log.type !== 'diff' && log.type !== 'graph') {
            //      console.log(JSON.stringify(log));
            // }
        }
        lastLogIndex = logs.length;
    }
}

function printStatus(s: any) {
    printLogs(s);
    console.log(`\n=== Turn ${s[S.turnsElapsed] + 1} / ${s[S.turnsRemaining] + s[S.turnsElapsed]} (${s[S.turnTypes][s[S.turnsElapsed]]}) ===`);
    console.log(`Score: ${Math.floor(s[S.score])} | Genki: ${Math.floor(s[S.genki])} | Stamina: ${Math.floor(s[S.stamina])}`);
    console.log(`Motivation: ${s[S.motivation]} | Weakness: ${s[1000] || 0}`);
    console.log(`Good Impression: ${s[S.goodImpressionTurns]} | Good Condition: ${s[S.goodConditionTurns]} | Concentration: ${s[S.concentration]}`);
    console.log(`Active Buffs: ` + (s[S.effects] || []).filter((e: any) => e.limit > 0 || e.ttl > 0).length);
}

function printHand(s: any) {
    console.log('\n--- Hand ---');
    s[S.handCards].forEach((cardIdx: number, i: number) => {
        const cardRef = s[S.cardMap][cardIdx];
        const cardData = SkillCards.getById(cardRef.id);
        console.log(`[${i}] ${cardData.name} (Cost: ${cardData.cost || 0})`);
    });
}

let lastScriptTurn = 0;

async function runScript(scriptPath: string) {
    const lines = fs.readFileSync(scriptPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

        if (trimmed.startsWith('=== Turn')) {
            const m = trimmed.match(/Turn (\d+)/);
            if (m) lastScriptTurn = parseInt(m[1]);
        }

        console.log(`> ${trimmed}`);
        await processCommand(trimmed);
    }
}

async function processCommand(cmd: string) {
    if (!cmd) return;
    console.log(`[Debug] Command: "${cmd}", TurnsElapsed: ${state[S.turnsElapsed]}, TurnsRemaining: ${state[S.turnsRemaining]}`);
    const parts = cmd.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
        case 's':
        case 'status':
            printStatus(state);
            break;
        case 'hand':
            printHand(state);
            break;
        case 'deck':
            console.log(`Deck size: ${state[S.deckCards].length}`);
            break;
        case 'turn':
        case 'end_turn':
        case 'e':
            const currentTurn = state[S.turnsElapsed] + 1;
            if (currentTurn <= lastScriptTurn) {
                state = engine.endTurn(state);
                printStatus(state);
            } else {
                console.log(`[Info] Skipping endTurn: Turn already advanced to ${currentTurn}`);
            }
            break;
        case 'play':
        case 'p': {
            let index = -1;
            const arg = args.join(' ');
            // Check if arg is number
            if (/^\d+$/.test(arg)) {
                index = parseInt(arg);
            } else {
                // Find by name in hand
                // Hand contains indices to cardMap
                const handIndices = state[S.handCards];
                // we iterate hand indices
                for (let i = 0; i < handIndices.length; i++) {
                    const cardRef = state[S.cardMap][handIndices[i]];
                    const cardData = SkillCards.getById(cardRef.id);
                    if (cardData.name === arg) {
                        index = i;
                        break;
                    }
                }
                // Partial match fallback?
                if (index === -1) {
                    for (let i = 0; i < handIndices.length; i++) {
                        const cardRef = state[S.cardMap][handIndices[i]];
                        const cardData = SkillCards.getById(cardRef.id);
                        if (cardData.name.includes(arg)) {
                            index = i;
                            break;
                        }
                    }
                }
            }

            if (index === -1 || index >= state[S.handCards].length) {
                console.log(`Card not found or invalid index: ${arg}`);
                return;
            }
            const cardIdx = state[S.handCards][index];
            state = engine.useCard(state, cardIdx);
            console.log('Card played.');
            break;
        }
        case 'force_hand': {
            // "force_hand CardName1, CardName2"
            const query = args.join(' ');
            const names = query.split(',').map(s => s.trim());

            // Move current hand to discard
            state[S.discardedCards].push(...state[S.handCards]);
            state[S.handCards] = [];

            const allCards = SkillCards.getAll ? SkillCards.getAll() : SkillCards.data;

            for (const name of names) {
                // 1. Search in Deck
                const findInPile = (pileKey: number) => {
                    const pile = state[pileKey];
                    for (let i = 0; i < pile.length; i++) {
                        const cIdx = pile[i];
                        const cardRef = state[S.cardMap][cIdx];
                        const cardData = SkillCards.getById(cardRef.id);
                        if (cardData.name === name) return i;
                    }
                    return -1;
                };

                let idxInPile = findInPile(S.deckCards);
                if (idxInPile !== -1) {
                    const cIdx = state[S.deckCards][idxInPile];
                    state[S.deckCards].splice(idxInPile, 1);
                    state[S.handCards].push(cIdx);
                    console.log(`Forced (from Deck): ${name}`);
                    continue;
                }

                idxInPile = findInPile(S.discardedCards);
                if (idxInPile !== -1) {
                    const cIdx = state[S.discardedCards][idxInPile];
                    state[S.discardedCards].splice(idxInPile, 1);
                    state[S.handCards].push(cIdx);
                    console.log(`Forced (from Discard): ${name}`);
                    continue;
                }

                // Fallback: Create New (Original Logic)
                let found = allCards.find((c: any) => c.name === name);

                if (found) {
                    engine.cardManager.addCardToHand(state, found.id);
                    console.log(`Forced (Created New): ${found.name} (${found.id})`);
                } else {
                    console.warn(`Card not found: "${name}"`);
                    const partial = allCards.find((c: any) => c.name.includes(name));
                    if (partial) {
                        console.log(`WARNING: Using partial match: ${partial.name}`);
                        engine.cardManager.addCardToHand(state, partial.id);
                    }
                }
            }
            printHand(state);
            break;
        }
        case 'eval':
            try {
                const res = eval(args.join(' '));
                console.log(res);
            } catch (e) {
                console.error(e);
            }
            break;
        case 'set': {
            // set motivation 10
            let key = args[0];
            if (key === 'hp') key = 'genki';
            const val = parseInt(args[1]);
            const field = S[key];
            if (field !== undefined) {
                state[field] = val;
                console.log(`Set ${key} to ${val}`);
            } else {
                console.log(`Unknown field ${key}`);
            }
            break;
        }
        default:
            console.log('Unknown command');
    }
}

cli.command('', 'Run interactive shell')
    .option('--tsubame', 'Load Tsubame stage')
    .option('--stage <number>', 'Stage number')
    .option('--script <file>', 'Run script file')
    .action(async (options) => {
        let stageName = 'tsubame_01'; // Default
        if (options.tsubame) {
            const num = String(options.stage || '01').padStart(2, '0');
            stageName = `tsubame_${num}`;
        }

        console.log(`Loading stage: ${stageName}`);
        try {
            // Check JSON data first
            const idolRoadStagesPath = path.resolve(__dirname, '../../../../gakumas-data/json/idol_road_stages.json');
            if (fs.existsSync(idolRoadStagesPath)) {
                const jsonStages = JSON.parse(fs.readFileSync(idolRoadStagesPath, 'utf-8'));
                const found = jsonStages.find((s: any) => s.id === options.stage || s.id === stageName);
                if (found) {
                    console.log(`[Interactive] Found stage in JSON: ${found.name}`);
                    stageDef = found;
                }
            }

            if (!stageDef) {
                // Import dynamically (legacy)
                const module = await import(`./stages/${stageName}`);
                stageDef = module.default || module[`${stageName.split('_')[0]}_${stageName.split('_')[1]}`]; // tsubame_01
            }

            if (!stageDef) throw new Error("Stage definition not found in export");

            engine = new IdolRoadStageEngine(stageDef);
            state = engine.getInitialState();
            state = engine.startStage(state);

            console.log('Engine initialized.');
            printStatus(state);

            if (options.script) {
                await runScript(options.script);
            } else {
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    prompt: '> '
                });
                rl.prompt();
                rl.on('line', async (line) => {
                    await processCommand(line.trim());
                    rl.prompt();
                });
            }

        } catch (e) {
            console.error("Failed to start:", e);
        }
    });

cli.help();
cli.parse();
