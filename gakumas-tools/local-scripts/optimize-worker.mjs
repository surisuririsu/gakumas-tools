
import { parentPort, workerData } from 'worker_threads';
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";

// Receive static data (stage info) from workerData
const { contestStage, numRuns } = workerData;
const stageConfig = new StageConfig(contestStage);

parentPort.on('message', async (task) => {
    // task: { id, combinations: [{ main: { data, filename }, sub: { data, filename } }, ...] }
    const { id, combinations } = task;
    const results = [];
    let pendingCount = 0;

    // Process chunk
    for (const comb of combinations) {
        const { main, sub } = comb;

        const loadout = {
            stageId: contestStage.id,
            supportBonus: 0.04,
            params: [0, 0, 0, 0],
            pItemIds: [0, 0, 0, 0],
            skillCardIdGroups: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
            customizationGroups: [[{}, {}, {}, {}, {}, {}], [{}, {}, {}, {}, {}, {}]],
        };

        // Apply Main
        loadout.params = main.data.params;
        loadout.pItemIds = main.data.pItemIds;
        loadout.skillCardIdGroups[0] = main.data.skillCardIds;
        loadout.customizationGroups[0] = main.data.customizations || [{}, {}, {}, {}, {}, {}];

        // Apply Sub
        const multiplier = 0.2;
        loadout.params = loadout.params.map((p, i) => p + Math.floor((sub.data.params[i] || 0) * multiplier));
        loadout.skillCardIdGroups[1] = sub.data.skillCardIds;
        loadout.customizationGroups[1] = sub.data.customizations || [{}, {}, {}, {}, {}, {}];

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
                // Ignore errors, but pushes 0 if we want to penalize? 
                // Or just skip. Current logic was skipping totalScore add.
                // runScores.push(0); // Optional: decide how to handle errors. 
                // Ensuring consistent count might be better, but for now sticking to original "ignore".
            }
        }

        if (runScores.length === 0) {
            results.push({
                mainFilename: main.filename,
                mainName: main.data.name,
                subFilename: sub.filename,
                subName: sub.data.name,
                score: 0,
                min: 0,
                max: 0,
                median: 0
            });
            parentPort.postMessage({ type: 'progress', count: 1 });
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
            mainFilename: main.filename,
            mainName: main.data.name,
            mainHash: main.hash,
            subFilename: sub.filename,
            subName: sub.data.name,
            subHash: sub.hash,
            score: avgScore,
            min: minScore,
            max: maxScore,
            median: medianScore,
            meta: main.meta // Pass through metadata
        });

        // Notify progress (batched)
        pendingCount++;
        if (pendingCount >= 10) {
            parentPort.postMessage({ type: 'progress', count: pendingCount });
            pendingCount = 0;
        }
    }

    if (pendingCount > 0) {
        parentPort.postMessage({ type: 'progress', count: pendingCount });
    }

    // Send back results
    parentPort.postMessage({ type: 'done', results });
});
