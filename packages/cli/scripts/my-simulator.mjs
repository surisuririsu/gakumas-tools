import { Stages, Idols, PItems, SkillCards } from "gakumas-data";
import { IdolConfig, StageConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Load translations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const messagesPath = path.join(__dirname, "../messages/ja.json");
const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));

function t(key, params = {}) {
    const parts = key.split(".");
    let val = messages;
    for (const part of parts) {
        val = val?.[part];
    }
    if (!val) return key;

    if (typeof val === "string") {
        return val.replace(/{(.+?)}/g, (_, p1) => params[p1] !== undefined ? params[p1] : `{${p1}}`);
    }
    return val;
}

async function run() {
    // Basic argument parsing
    const args = process.argv.slice(2);
    let season = 37;
    let stageNumber = 3;
    let iterations = 1;
    let mainMemoryPath = null;
    let subMemoryPath = null;

    // Argument Parsing
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--iterations" && args[i + 1]) {
            iterations = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === "--main" && args[i + 1]) {
            mainMemoryPath = args[i + 1];
            i++;
        } else if (args[i] === "--sub" && args[i + 1]) {
            subMemoryPath = args[i + 1];
            i++;
        } else if (!args[i].startsWith("--")) {
            const parts = args[i].split("-");
            if (parts.length === 2) {
                season = parseInt(parts[0], 10);
                stageNumber = parseInt(parts[1], 10);
            }
        }
    }

    if (args.length === 0) {
        console.log("使用法: yarn simulate [シーズン-ステージ番号] [--iterations N] [--main file] [--sub file]");
        console.log("例: yarn simulate 37-3 --iterations 100 --main ./memories/main.json --sub ./memories/sub.json");
    }

    const stages = Stages.getAll();
    const contestStage = stages.find((s) => s.type == "contest" && s.season == season && s.stage == stageNumber);

    if (!contestStage) {
        console.error(`ステージが見つかりません: シーズン${season} ステージ${stageNumber}`);
        process.exit(1);
    }

    const stage = contestStage;

    console.log(`ステージ: ${t("StageSummary.contestStageName", { season: stage.season, stage: stage.stage })}`);
    console.log(`詳細: ${stage.plan} / ${stage.turnCounts.vocal + stage.turnCounts.dance + stage.turnCounts.visual}ターン`);

    // Default Loadout
    const loadout = {
        stageId: stage.id,
        supportBonus: 0.04,
        params: [1500, 1500, 1500, 50],
        pItemIds: [0, 0, 0, 0],
        skillCardIdGroups: [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
        customizationGroups: [[{}, {}, {}, {}, {}, {}], [{}, {}, {}, {}, {}, {}]],
    };

    // Memory Loading Logic
    if (mainMemoryPath) {
        if (!fs.existsSync(mainMemoryPath)) {
            console.error(`メインメモリーファイルが見つかりません: ${mainMemoryPath}`);
            process.exit(1);
        }
        const memory = JSON.parse(fs.readFileSync(mainMemoryPath, "utf8"));
        loadout.params = memory.params;
        loadout.pItemIds = memory.pItemIds;

        // Fix data structure for skill cards and customizations
        if (memory.skillCardIds) {
            loadout.skillCardIdGroups = [memory.skillCardIds, []];
        }
        if (memory.customizations) {
            loadout.customizationGroups = [memory.customizations, []];
        } else if (memory.customizationGroups) {
            loadout.customizationGroups = memory.customizationGroups;
        }

        // Inject P-Idol Signature Items/Cards if pIdolId is present
        if (memory.pIdolId) {
            const pIdolId = memory.pIdolId;

            // Signature P-Items
            const signaturePItems = PItems.getAll().filter(item => item.sourceType == "pIdol" && item.pIdolId == pIdolId);
            for (const item of signaturePItems) {
                if (!loadout.pItemIds.includes(item.id)) {
                    // Find first empty slot (0) or push
                    const emptyIdx = loadout.pItemIds.indexOf(0);
                    if (emptyIdx !== -1) {
                        loadout.pItemIds[emptyIdx] = item.id;
                    } else {
                        loadout.pItemIds.push(item.id);
                    }
                }
            }

            // Signature Skill Cards
            const signatureSkillCards = SkillCards.getAll().filter(card => card.sourceType == "pIdol" && card.pIdolId == pIdolId);
            for (const card of signatureSkillCards) {
                if (!loadout.skillCardIdGroups[0].includes(card.id)) {
                    loadout.skillCardIdGroups[0].push(card.id);
                }
            }
        }
    }

    if (subMemoryPath) {
        if (!fs.existsSync(subMemoryPath)) {
            console.error(`サブメモリーファイルが見つかりません: ${subMemoryPath}`);
            process.exit(1);
        }
        const memory = JSON.parse(fs.readFileSync(subMemoryPath, "utf8"));

        // Add 50% of stats from sub memory
        loadout.params = loadout.params.map((p, i) => p + Math.floor((memory.params[i] || 0) * 0.5));
    }

    const idolConfig = new IdolConfig(loadout);
    const stageConfig = new StageConfig(stage);
    const config = new IdolStageConfig(idolConfig, stageConfig);

    // Simulation Loop
    let totalScore = 0;
    const scores = [];

    console.log(`シミュレーションを開始します... (${iterations} 回)`);

    for (let i = 0; i < iterations; i++) {
        const engine = new StageEngine(config);
        const StrategyClass = STRATEGIES["HeuristicStrategy"];

        if (!StrategyClass) {
            console.error("HeuristicStrategy が見つかりません");
            process.exit(1);
        }

        const strategy = new StrategyClass(engine);
        engine.strategy = strategy;

        const player = new StagePlayer(engine, strategy);

        const result = await player.play();
        totalScore += result.score;
        scores.push(result.score);

        // Only show log for the first run
        if (i === 0) {
            console.log("---------------------------------------------------");
            console.log(`結果 (1回目): ${result.score}`);
            console.log(`推奨: ${t("stage.numTurns", { num: stageConfig.turnCount })}`);

            // Format logs if available
            if (result.logs && result.logs.length > 0) {
                console.log("---------------------------------------------------");
                console.log("ログ:");
                let currentTurn = 0;
                result.logs.forEach(log => {
                    if (log.logType === "turnStart") {
                        currentTurn = log.data.turn;
                        console.log(`\n[${t("stage.turnN", { n: currentTurn })}]`);
                    }

                    let message = "";
                    if (log.logType === "cardUse") {
                        const cardName = log.data.name;
                        message = `スキルカード使用: ${cardName || "不明"}`;
                    } else if (log.logType === "specialAction") {
                        message = `特殊アクション: ${log.data.name || "不明"}`;
                    }

                    if (message) console.log(`  ${message}`);
                });
            }
            console.log("---------------------------------------------------");
        }
    }

    const avgScore = Math.floor(totalScore / iterations);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    scores.sort((a, b) => a - b);
    const mid = Math.floor(scores.length / 2);
    const medianScore = scores.length % 2 !== 0 ? scores[mid] : Math.floor((scores[mid - 1] + scores[mid]) / 2);

    console.log(`試行回数: ${iterations}`);
    console.log(`平均スコア: ${avgScore}`);
    console.log(`中央値: ${medianScore}`);
    console.log(`最高スコア: ${maxScore}`);
    console.log(`最低スコア: ${minScore}`);
    console.log("---------------------------------------------------");
}

run().catch(arg => console.error("Error:", arg));
