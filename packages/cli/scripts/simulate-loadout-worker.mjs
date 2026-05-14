
import { parentPort, workerData } from 'worker_threads';
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";


// Receive static data (stage info) from workerData
const { contestStage, numRuns } = workerData;
const stageConfig = new StageConfig(contestStage);


async function simulateOne(loadoutData, contestStage, stageConfig) {
    const loadout = {
        stageId: contestStage.id,
        supportBonus: 0.04, // Default assumption
        params: [0, 0, 0, 0],
        pItemIds: [0, 0, 0, 0],
        skillCardIdGroups: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
        customizationGroups: [[{}, {}, {}, {}, {}, {}], [{}, {}, {}, {}, {}, {}]],
        ...loadoutData // Override with passed data
    };

    if (loadout.supportBonus >= 1.0) {
        loadout.supportBonus = loadout.supportBonus / 100;
    }

    const idolConfig = new IdolConfig(loadout);
    const config = new IdolStageConfig(idolConfig, stageConfig);

    const engine = new StageEngine(config);
    const StrategyClass = STRATEGIES["HeuristicStrategy"];
    const strategy = new StrategyClass(engine);
    engine.strategy = strategy;
    const player = new StagePlayer(engine, strategy);

    try {
        const result = await player.play();
        return result.score;
    } catch (e) {
        console.error("Simulation error:", e);
        return 0;
    }
}

function calculateStats(scores) {
    if (scores.length === 0) return { score: 0, min: 0, max: 0, median: 0, q1: 0, q3: 0 };
    
    const sorted = [...scores].sort((a, b) => a - b);
    const totalScore = sorted.reduce((acc, s) => acc + s, 0);
    const avgScore = totalScore / sorted.length;
    const minScore = sorted[0];
    const maxScore = sorted[sorted.length - 1];

    const getMedian = (arr) => {
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const medianScore = getMedian(sorted);
    const q1Score = getMedian(sorted.slice(0, Math.floor(sorted.length / 2)));
    const q3Score = getMedian(sorted.slice(Math.ceil(sorted.length / 2)));

    return {
        score: avgScore,
        min: minScore,
        max: maxScore,
        median: medianScore,
        q1: q1Score,
        q3: q3Score
    };
}

parentPort.on('message', async (task) => {
    const { id, loadouts } = task;
    const results = [];

    if (id === 'rehearsal') {
        const runScores = Array.from({ length: loadouts.length }, () => []);
        const totalScores = [];

        for (let i = 0; i < numRuns; i++) {
            const currentRunScores = [];
            for (let j = 0; j < loadouts.length; j++) {
                const score = await simulateOne(loadouts[j], contestStage, stageConfig);
                currentRunScores.push(score);
                runScores[j].push(score);
            }

            // Calculate total score for this run (1.2x bonus for the highest)
            const sorted = [...currentRunScores].sort((a, b) => b - a);
            let total = 0;
            if (sorted.length > 0) {
                total = sorted[0] * 1.2 + sorted.slice(1).reduce((acc, s) => acc + s, 0);
            }
            totalScores.push(Math.floor(total));

            if ((i + 1) % 10 === 0 || i + 1 === numRuns) {
                parentPort.postMessage({ type: 'progress', loadoutId: 'Total', currentRun: i + 1, totalRuns: numRuns });
            }
        }

        for (let j = 0; j < loadouts.length; j++) {
            results.push({
                id: loadouts[j].id,
                ...calculateStats(runScores[j])
            });
        }

        // Add special total result
        results.push({
            id: 'TOTAL_SCORE',
            ...calculateStats(totalScores)
        });

    } else {
        // Sequential mode (Contest/Tournament)
        for (const loadoutData of loadouts) {
            const runScores = [];
            for (let i = 0; i < numRuns; i++) {
                const score = await simulateOne(loadoutData, contestStage, stageConfig);
                runScores.push(score);
                if ((i + 1) % 10 === 0 || i + 1 === numRuns) {
                    parentPort.postMessage({ type: 'progress', loadoutId: loadoutData.id, currentRun: i + 1, totalRuns: numRuns });
                }
            }
            results.push({
                id: loadoutData.id,
                ...calculateStats(runScores)
            });
        }
    }

    parentPort.postMessage({ type: 'done', results });
});

