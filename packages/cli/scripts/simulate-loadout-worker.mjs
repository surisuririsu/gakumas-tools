
import { parentPort, workerData } from 'worker_threads';
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "./lib/gakumas-engine/index.js";


// Receive static data (stage info) from workerData
const { contestStage, numRuns } = workerData;
const stageConfig = new StageConfig(contestStage);

parentPort.on('message', async (task) => {
    // task: { id, loadouts: [ { id, params, pItemIds, skillCardIdGroups, customizationGroups, ... }, ... ] }
    const { id, loadouts } = task;
    const results = [];

    // Process chunk
    for (const loadoutData of loadouts) {
        // Construct full loadout object
        const loadout = {
            stageId: contestStage.id,
            supportBonus: 0.04, // Default assumption
            params: [0, 0, 0, 0],
            pItemIds: [0, 0, 0, 0],
            skillCardIdGroups: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
            customizationGroups: [[{}, {}, {}, {}, {}, {}], [{}, {}, {}, {}, {}, {}]],
            ...loadoutData // Override with passed data
        };

        // Setup Engine
        const idolConfig = new IdolConfig(loadout);
        const config = new IdolStageConfig(idolConfig, stageConfig);

        const runScores = [];

        for (let i = 0; i < numRuns; i++) {
            const engine = new StageEngine(config);
            const StrategyClass = STRATEGIES["HeuristicStrategy"];
            const strategy = new StrategyClass(engine);
            engine.strategy = strategy;
            const player = new StagePlayer(engine, strategy);

            try {
                const result = await player.play();
                runScores.push(result.score);
            } catch (e) {
                // runScores.push(0); 
            }
        }

        if (runScores.length === 0) {
            results.push({
                id: loadoutData.id,
                score: 0,
                min: 0,
                max: 0,
                median: 0
            });
            continue;
        }

        runScores.sort((a, b) => a - b);
        const totalScore = runScores.reduce((acc, s) => acc + s, 0);
        const avgScore = totalScore / runScores.length;
        const minScore = runScores[0];
        const maxScore = runScores[runScores.length - 1];
        const mid = Math.floor(runScores.length / 2);
        const medianScore = runScores.length % 2 !== 0 ? runScores[mid] : (runScores[mid - 1] + runScores[mid]) / 2;

        results.push({
            id: loadoutData.id, // Pass back ID to track which individual this result belongs to
            score: avgScore,
            min: minScore,
            max: maxScore,
            median: medianScore
        });
    }

    // Send back results
    parentPort.postMessage({ type: 'done', results });
});
