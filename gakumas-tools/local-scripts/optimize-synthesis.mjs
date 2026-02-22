
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import os from 'os';
import { Worker } from 'worker_threads';
import { Stages } from 'gakumas-data';

// Configuration
const { MONGODB_URI, MONGODB_DB } = process.env;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load Skill Cards Metadata
// We need to resolve where gakumas-data is located or use require.
// But as we are ESM, let's use the package's data. 
// Actually, 'gakumas-data' exports SkillCards. Let's use that instead of reading raw JSON if possible,
// but the current logic reads JSON for metadata (params etc?).
// checking gakumas-data export... it exports SkillCards.
// Let's import SkillCards from gakumas-data too.
import { SkillCards } from 'gakumas-data';

// However, SkillCards.getAll() might return instances or objects. 
// Existing code expects raw JSON structure.
// Let's assume SkillCards.getAll() returns the list of cards.
const skillCardsData = SkillCards.getAll();
const skillCardsMap = new Map(skillCardsData.map(c => [c.id, c]));

function getCard(id) {
    return skillCardsMap.get(id);
}

function loadMemory(input) {
    if (fs.existsSync(input)) {
        return JSON.parse(fs.readFileSync(input, 'utf8'));
    }
    throw new Error(`File not found: ${input}`);
}

// Check if a card is swappable (Not P-Idol Signature or Support Card)
function isSwappable(cardId) {
    const card = getCard(cardId);
    if (!card) return false; // Unknown card, safe to skip or assume swappable? Better skip.
    return card.sourceType !== 'pIdol' && card.sourceType !== 'support';
}

function getLoadoutData(memory) {
    return {
        name: memory.name || "Unknown",
        params: memory.params,
        pItemIds: memory.pItemIds,
        skillCardIds: memory.skillCardIds,
        customizations: memory.customizations
    };
}

/**
 * Core synthesis recommendation logic
 * @param {Object} mainMemory - Main memory object
 * @param {Object} subMemory - Sub memory object
 * @param {string|number} stageId - Stage ID
 * @param {number} runs - Number of simulation runs
 * @returns {Promise<Array>} - Specific recommendations sorted by score
 */
export async function recommendSynthesis(mainMemory, subMemory, stageId, runs) {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI が設定されていません");
    }

    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(MONGODB_DB || "gakumas-tools");
        const collection = db.collection("memories");

        if (!mainMemory.pIdolId) {
            throw new Error("メインメモリーに pIdolId が設定されていません。合成候補を検索できません。");
        }

        // Filter: Same Idol/Song (Approximated by pIdolId)
        let query = { pIdolId: mainMemory.pIdolId };

        if (mainMemory._id) {
            query._id = { $ne: mainMemory._id };
        }

        console.error(`合成候補検索: pIdolId=${mainMemory.pIdolId} (Exclude: ${mainMemory._id || 'None'})`);
        const candidates = await collection.find(query).toArray();
        console.error(`合成候補数: ${candidates.length}件`);

        if (candidates.length === 0) {
            return [];
        }

        // Generate combinations
        const tasks = [];
        const seenCombinations = new Set();

        for (let slotIndex = 0; slotIndex < mainMemory.skillCardIds.length; slotIndex++) {
            const originalCardId = mainMemory.skillCardIds[slotIndex];

            if (!isSwappable(originalCardId)) {
                continue;
            }

            for (const candidate of candidates) {
                if (mainMemory._id && candidate._id && mainMemory._id.toString() === candidate._id.toString()) continue;
                // Safety check: ensure pIdolId matches (in case of query issues)
                if (candidate.pIdolId !== mainMemory.pIdolId) continue;

                for (let candSlotIndex = 0; candSlotIndex < candidate.skillCardIds.length; candSlotIndex++) {
                    const newCardId = candidate.skillCardIds[candSlotIndex];

                    if (!isSwappable(newCardId)) continue;

                    // Duplicate check (same card ID)
                    if (originalCardId === newCardId) continue;

                    const originalCard = getCard(originalCardId);
                    const newCard = getCard(newCardId);

                    // Rarity Check: Cannot replace with a higher rarity card (e.g. SR -> SSR is invalid)
                    // Also consider '+' as higher rank than normal
                    const rarityRank = { 'R': 10, 'SR': 20, 'SSR': 30 };
                    let originRank = rarityRank[originalCard.rarity] || 0;
                    let newRank = rarityRank[newCard.rarity] || 0;

                    if (originalCard.name.endsWith('+')) originRank += 1;
                    if (newCard.name.endsWith('+')) newRank += 1;

                    if (newRank > originRank) continue;

                    // Name uniqueness check
                    const otherCardIds = mainMemory.skillCardIds.filter((_, idx) => idx !== slotIndex);
                    const otherCardNames = otherCardIds.map(id => getCard(id)?.name);

                    if (otherCardNames.includes(newCard.name)) {
                        continue;
                    }

                    let newCustomization = {};
                    if (candidate.customizations && candidate.customizations[candSlotIndex]) {
                        newCustomization = candidate.customizations[candSlotIndex];
                    }

                    const taskKey = `${slotIndex}-${newCardId}-${JSON.stringify(newCustomization)}`;
                    if (seenCombinations.has(taskKey)) continue;
                    seenCombinations.add(taskKey);

                    const modifiedMemory = JSON.parse(JSON.stringify(mainMemory));
                    modifiedMemory.skillCardIds[slotIndex] = newCardId;

                    if (!modifiedMemory.customizations) modifiedMemory.customizations = [];
                    modifiedMemory.customizations[slotIndex] = newCustomization;

                    const description = `Slot ${slotIndex}: ${originalCard.name} -> ${newCard.name}`;
                    const loadoutData = getLoadoutData(modifiedMemory);
                    loadoutData.name = description;

                    const taskInfo = {
                        mainFilename: `SLOT_${slotIndex}`,
                        mainName: description,
                        data: loadoutData,
                        // Additional metadata for reporting
                        meta: {
                            slot: slotIndex + 1, // Human readable 1-based
                            originalName: originalCard.name,
                            originalRarity: originalCard.rarity,
                            newName: newCard.name,
                            newRarity: newCard.rarity
                        }
                    };

                    tasks.push({
                        main: taskInfo,
                        sub: {
                            filename: "SUB_MEMORY",
                            data: getLoadoutData(subMemory)
                        }
                    });
                }
            }
        }

        if (tasks.length === 0) {
            return [];
        }

        // Stage Info
        const contestStage = Stages.getById(stageId);
        if (!contestStage) {
            throw new Error(`ステージ ${stageId} が見つかりません`);
        }

        // Run Parallel Simulation
        const numThreads = Math.max(1, os.cpus().length - 1);
        const chunkSize = Math.ceil(tasks.length / numThreads);
        const chunks = [];
        for (let i = 0; i < tasks.length; i += chunkSize) {
            chunks.push(tasks.slice(i, i + chunkSize));
        }

        let completedCount = 0;
        const allResults = [];

        const workers = [];

        const promises = chunks.map((chunk) => {
            return new Promise((resolve, reject) => {
                const workerPath = path.join(__dirname, 'worker-boot.mjs');
                const worker = new Worker(workerPath, {
                    workerData: {
                        contestStage,
                        numRuns: runs
                    }
                });
                workers.push(worker);

                worker.on('message', (msg) => {
                    if (msg.type === 'progress') {
                        completedCount += msg.count;
                        // Show progress on stderr
                        if (tasks.length > 0) {
                            process.stderr.write(`\r- 合成進捗: ${completedCount}/${tasks.length} (${Math.round(completedCount / tasks.length * 100)}%)`);
                        }
                    } else if (msg.type === 'done') {
                        allResults.push(...msg.results);
                        resolve();
                    }
                });

                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                });

                worker.postMessage({ id: 0, combinations: chunk });
            });
        });

        try {
            await Promise.all(promises);
            process.stderr.write('\n');
        } finally {
            for (const worker of workers) {
                worker.terminate();
            }
        }

        // Sort
        allResults.sort((a, b) => b.score - a.score);
        return allResults;

    } finally {
        await client.close();
    }
}

// Prevent crash on pipe/stream errors (e.g. EPIPE, ETIMEDOUT)
[process.stdout, process.stderr].forEach(stream => {
    stream.on('error', (err) => {
        if (err.code === 'EPIPE' || err.code === 'ETIMEDOUT') {
            return;
        }
    });
});

// CLI Entry Point
async function run() {
    const args = process.argv.slice(2);
    // Rough check if called directly (not imported)
    // In node, process.argv[1] is the script path.
    const isMain = process.argv[1].endsWith('optimize-synthesis.mjs');

    if (isMain) {
        if (args.length < 4) {
            console.log("使用法: yarn node scripts/optimize-synthesis.mjs <main_file> <sub_file> <stage> <runs>");
            process.exit(1);
        }

        const [mainFile, subFile, stageId, runsStr] = args;
        const runs = parseInt(runsStr, 10);

        try {
            const mainMemory = loadMemory(mainFile);
            const subMemory = loadMemory(subFile);

            console.log(`メインメモリー: ${mainMemory.name || "Unknown"} (pIdolId: ${mainMemory.pIdolId})`);
            console.log("候補メモリーを同一アイドル条件 (pIdolId) で検索中...");

            const results = await recommendSynthesis(mainMemory, subMemory, stageId, runs);

            console.log(`シミュレーション完了! (${results.length} パターン)`);
            console.log("\n--- 推奨合成結果 (TOP 20) ---");
            results.slice(0, 20).forEach((res, i) => {
                console.log(`${i + 1}. Score: ${res.score.toFixed(1)} | ${res.mainName}`);
            });

        } catch (e) {
            console.error("エラー:", e.message);
            process.exit(1);
        }
    }
}

// ESM allows top-level await, but for module export we usually don't run side effects.
// Only run if main.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
