import { parentPort, workerData } from 'worker_threads';
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";
import { S } from "gakumas-engine/constants";
import { PIdols } from "gakumas-data";

// Receive static data (stage info, memories) from workerData
const { contestStage, numRuns, supportBonus, memories } = workerData;
const stageConfig = new StageConfig(contestStage);

const NUM_BUCKETS = 40;

/**
 * Summarizes an array of scores into statistical indicators.
 */
function summarizeScores(scores) {
    if (!scores || !scores.length) return null;
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    const min = sorted[0];
    const max = sorted[n - 1];
    const q = (p) => {
        const idx = (n - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        if (lo === hi) return sorted[lo];
        return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const q1 = q(0.25);
    const median = q(0.5);
    const q3 = q(0.75);
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    const variance =
        sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);

    const range = max - min;
    let bucketSize = range > 0 ? Math.ceil(range / NUM_BUCKETS) : 1;
    const buckets = new Array(NUM_BUCKETS).fill(0);
    for (const s of sorted) {
        const idx = Math.min(NUM_BUCKETS - 1, Math.floor((s - min) / bucketSize));
        buckets[idx]++;
    }

    return {
        count: n,
        min,
        q1,
        median,
        mean,
        q3,
        max,
        stddev,
        bucketMin: min,
        bucketSize,
        buckets,
    };
}

parentPort.on('message', async (task) => {
    // task: { id, startIndex, endIndex, filterHashes, skipHashes }
    // If filterHashes is provided, only simulate those combinations.
    // If skipHashes is provided, skip those combinations.
    const { id, startIndex, endIndex, filterHashes, skipHashes } = task;
    const results = [];
    let pendingCount = 0;

    const hashSet = filterHashes ? new Set(filterHashes) : null;
    const skipSet = skipHashes ? new Set(skipHashes) : null;

    // Process range of Main memories
    const mainMemories = memories.slice(startIndex, endIndex);

    for (const main of mainMemories) {
        for (const sub of memories) {
            const hashPair = `${main.hash}_${sub.hash}`;
            const isTarget = !hashSet || hashSet.has(hashPair);
            const isSkip = skipSet && skipSet.has(hashPair);
            
            if (!isTarget || isSkip) {
                // Still count towards progress so the bar moves
                pendingCount++;
                if (pendingCount >= 500) { // Higher batch for skipped items
                    parentPort.postMessage({ type: 'progress', count: pendingCount });
                    pendingCount = 0;
                }
                continue;
            }

            const loadout = {
                stageId: contestStage.id,
                supportBonus: supportBonus !== undefined ? supportBonus : 0.04,
                params: [0, 0, 0, 0],
                pItemIds: [0, 0, 0, 0],
                skillCardIdGroups: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
                customizationGroups: [[{}, {}, {}, {}, {}, {}], [{}, {}, {}, {}, {}, {}]],
            };

            // Apply Main
            loadout.params = [...main.data.params];
            // Memory P-items: Only Main memory provides its P-item to the simulation loadout.
            loadout.pItemIds = [...(main.data.pItemIds || [])].filter(id => id > 0);
            loadout.skillCardIdGroups[0] = main.data.skillCardIds;
            loadout.customizationGroups[0] = main.data.customizations || [{}, {}, {}, {}, {}, {}];
            loadout.skillCardIdGroups[1] = sub.data.skillCardIds;
            loadout.customizationGroups[1] = sub.data.customizations || [{}, {}, {}, {}, {}, {}];

            // Apply Sub
            const multiplier = 0.2;
            loadout.params = loadout.params.map((p, i) => p + Math.floor((sub.data.params[i] || 0) * multiplier));

            const StrategyClass = STRATEGIES["HeuristicStrategy"];
            const runScores = [];

            for (let i = 0; i < numRuns; i++) {
                try {
                    const idolConfig = new IdolConfig(loadout);
                    
                    // Force P-idol ID from Main memory if inferred ID belongs to a different idol or is missing.
                    // This ensures scoring logic (HeuristicStrategy) uses the correct idol's weights.
                    if (main.data.pIdolId && idolConfig.pIdolId !== main.data.pIdolId) {
                        const mainPIdol = PIdols.getById(main.data.pIdolId);
                        if (mainPIdol) {
                            idolConfig.pIdolId = mainPIdol.id;
                            idolConfig.idolId = mainPIdol.idolId;
                            idolConfig.plan = mainPIdol.plan;
                            idolConfig.recommendedEffect = mainPIdol.recommendedEffect;
                        }
                    }

                    const config = new IdolStageConfig(idolConfig, stageConfig);
                    const engine = new StageEngine(config);
                    
                    // Mock logger for performance
                    engine.logger.logs = [{}];
                    engine.logger.log = () => 0;
                    engine.logger.pushGraphData = () => {};
                    engine.logger.debug = () => {};
                    engine.logger.reset = () => {};

                    const strategy = new StrategyClass(engine);
                    const player = new StagePlayer(engine, strategy);

                    const result = await player.play();
                    if (result && typeof result.score === 'number') {
                        runScores.push(result.score);
                    }
                } catch (e) {
                    // Log errors but continue runs
                    if (i === 0 || hashSet) {
                        console.error(`[Worker] Simulation failed (run ${i}): ${e.message}`);
                    }
                }
            }

            if (runScores.length === 0) {
                results.push({
                    mainName: main.filename.replace(".json", ""),
                    subName: sub.filename.replace(".json", ""),
                    mainHash: main.hash, subHash: sub.hash,
                    score: 0, min: 0, max: 0, median: 0, q1: 0, q3: 0, potential: 0,
                    stats: null
                });
                parentPort.postMessage({ type: 'progress', count: 1 });
                continue;
            }

            const stats = summarizeScores(runScores);

            results.push({
                mainHash: main.hash,
                subHash: sub.hash,
                mainFilename: main.filename,
                subFilename: sub.filename,
                mainName: main.filename.replace(".json", ""),
                subName: sub.filename.replace(".json", ""),
                score: stats.mean,
                min: stats.min,
                max: stats.max,
                median: stats.median,
                q1: stats.q1,
                q3: stats.q3,
                potential: stats.mean + 0.3 * (stats.max - stats.mean),
                stats
            });

            pendingCount++;
            if (pendingCount >= (hashSet ? 1 : 10)) {
                parentPort.postMessage({ type: 'progress', count: pendingCount });
                pendingCount = 0;
            }

            // Phase 1 Optimization: If we have many results and no filter, keep only top performers to save memory
            if (!hashSet && results.length > 500) {
                results.sort((a, b) => b.potential - a.potential);
                results.length = 200; // Keep only top 200 in this worker's chunk
            }
        }
    }

    // Flush remaining progress
    if (pendingCount > 0) {
        parentPort.postMessage({ type: 'progress', count: pendingCount });
    }

    // Send back results
    parentPort.postMessage({ type: 'done', results });
});
