
import { Stages } from "gakumas-data";
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log("使用法: yarn node scripts/optimize-memories.mjs <memories_dir> <season-stage> <num_runs>");
        console.log("  <memories_dir>: メモリーJSONファイルがあるディレクトリ");
        console.log("  <season-stage>: ステージ (例: 37-3)");
        console.log("  <num_runs>: 各組み合わせごとの試行回数 (推奨: 100以上)");
        process.exit(1);
    }

    const memoriesDir = args[0];
    const [seasonStr, stageStr] = args[1].split("-");
    const season = parseInt(seasonStr, 10);
    const stageNumber = parseInt(stageStr, 10);
    const numRuns = parseInt(args[2], 10);

    // Load Stage
    const stages = Stages.getAll();
    const contestStage = stages.find((s) => s.type == "contest" && s.season == season && s.stage == stageNumber);

    if (!contestStage) {
        console.error(`ステージが見つかりません: シーズン${season} ステージ${stageNumber}`);
        process.exit(1);
    }

    // Load Memories
    const memoryFiles = fs.readdirSync(memoriesDir).filter(f => f.endsWith(".json"));
    if (memoryFiles.length === 0) {
        console.error("メモリーファイルが見つかりません (.json)");
        process.exit(1);
    }

    console.log(`${memoryFiles.length} ファイルのメモリーを読み込み中...`);
    const memories = memoryFiles.map(f => ({
        filename: f,
        data: JSON.parse(fs.readFileSync(path.join(memoriesDir, f), "utf8"))
    }));

    console.log(`ステージ: シーズン${season} ステージ${stageNumber}`);
    console.log(`試行回数: ${numRuns} 回/組`);
    console.log("シミュレーション開始... (時間がかかります)");

    let bestScore = -1;
    let bestComb = null;
    const allResults = [];
    let count = 0;
    const totalCombs = memories.length * (memories.length - 1);

    // Iterate combinations
    // We treat Main and Sub as distinct roles. Main gets full stats. Sub gets 20% stats.
    // Combinations: Memory A (Main) + Memory B (Sub) != Memory B (Main) + Memory A (Sub)

    for (const mainMem of memories) {
        for (const subMem of memories) {
            if (mainMem.filename === subMem.filename) continue; // Skip same file (assuming unique files per memory)

            count++;
            if (count % 10 === 0) process.stdout.write(`\r進捗: ${count}/${totalCombs}`);

            const loadout = {
                stageId: contestStage.id,
                supportBonus: 0.04,
                params: [0, 0, 0, 0],
                pItemIds: [0, 0, 0, 0],
                skillCardIdGroups: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
                customizationGroups: [[{}, {}, {}, {}, {}, {}], [{}, {}, {}, {}, {}, {}]],
            };

            // Apply Main
            loadout.params = mainMem.data.params;
            loadout.pItemIds = mainMem.data.pItemIds;
            loadout.skillCardIdGroups[0] = mainMem.data.skillCardIds;
            loadout.customizationGroups[0] = mainMem.data.customizations || [{}, {}, {}, {}, {}, {}];

            // Apply Sub
            const multiplier = 0.2;
            loadout.params = loadout.params.map((p, i) => p + Math.floor((subMem.data.params[i] || 0) * multiplier));
            loadout.skillCardIdGroups[1] = subMem.data.skillCardIds;
            loadout.customizationGroups[1] = subMem.data.customizations || [{}, {}, {}, {}, {}, {}];

            // Setup Engine
            const idolConfig = new IdolConfig(loadout);
            const stageConfig = new StageConfig(contestStage);
            const config = new IdolStageConfig(idolConfig, stageConfig);

            // Run simulation multiple times
            let totalScore = 0;
            // let minScore = Infinity;

            // Reuse engine/player instances if possible? 
            // StageEngine keeps state, so new instance needed per run.

            for (let i = 0; i < numRuns; i++) {
                const engine = new StageEngine(config);
                const StrategyClass = STRATEGIES["HeuristicStrategy"];
                const strategy = new StrategyClass(engine);
                engine.strategy = strategy;
                const player = new StagePlayer(engine, strategy);

                // We need to catch errors or assume it works
                try {
                    const result = await player.play();
                    totalScore += result.score;
                } catch (e) {
                    // console.error(e);
                }
            }

            const avgScore = totalScore / numRuns;

            if (avgScore > bestScore) {
                bestScore = avgScore;
                bestComb = { main: mainMem, sub: subMem, score: avgScore };
            }

            allResults.push({ main: mainMem, sub: subMem, score: avgScore });
        }
    }

    // Sort results
    allResults.sort((a, b) => b.score - a.score);

    console.log("\n===================================================");
    console.log("              最適化結果レポート              ");
    console.log("===================================================");

    // Top 5 Combinations
    console.log("\n【ベスト編成 TOP 5】");
    allResults.slice(0, 5).forEach((res, i) => {
        console.log(`${i + 1}. スコア: ${Math.round(res.score)}`);
        console.log(`   Main: ${res.main.filename} (${res.main.data.name || "No Name"})`);
        console.log(`   Sub : ${res.sub.filename} (${res.sub.data.name || "No Name"})`);
    });

    // Worst 5 Combinations
    console.log("\n【ワースト編成 TOP 5】");
    const worstResults = [...allResults].sort((a, b) => a.score - b.score);
    worstResults.slice(0, 5).forEach((res, i) => {
        console.log(`${i + 1}. スコア: ${Math.round(res.score)}`);
        console.log(`   Main: ${res.main.filename}`);
        console.log(`   Sub : ${res.sub.filename}`);
    });

    // Memory Rankings (Average Score as Main)
    const memoryStats = {};
    for (const res of allResults) {
        const key = res.main.filename;
        if (!memoryStats[key]) {
            memoryStats[key] = {
                filename: key,
                name: res.main.data.name,
                totalScore: 0,
                count: 0
            };
        }
        memoryStats[key].totalScore += res.score;
        memoryStats[key].count++;
    }

    const memoryRanking = Object.values(memoryStats).map(stat => ({
        ...stat,
        average: stat.totalScore / stat.count
    }));

    // Sort by average score ascending (Weakest first)
    memoryRanking.sort((a, b) => a.average - b.average);

    console.log("\n【メモリー性能ランキング (平均スコア順・下位)】");
    console.log("※ メインメモリーとして使用した際の平均スコアが低い順");
    memoryRanking.slice(0, 10).forEach((stat, i) => {
        console.log(`${i + 1}. 平均スコア: ${Math.round(stat.average)}`);
        console.log(`   File: ${stat.filename}`);
        console.log(`   Name: ${stat.name || "No Name"}`);
    });

    console.log("---------------------------------------------------");
}

run().catch(console.error);
