
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from 'worker_threads';
import os from 'os';
import { MongoClient } from "mongodb";
import { Stages, PIdols, Idols } from "./lib/gakumas-data/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const jsonDir = path.join(projectRoot, "packages/gakumas-data/json");

// Helper to load JSON directly
function loadJson(name) {
    return JSON.parse(fs.readFileSync(path.join(jsonDir, name), "utf-8"));
}

const IDOL_NAME_TO_ID = {
    "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
    "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
};

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("使用法: ./local-run opt-deck <season-stage> [num_runs] <idolName> <plan>");
        console.error("例: ./local-run opt-deck 37-1 1000 kotone sense");
        console.error("例: ./local-run opt-deck 37-1 kotone sense (デフォルト試行回数: 3000)");
        process.exit(1);
    }

    const [seasonStr, stageStr] = args[0].split("-");
    const season = parseInt(seasonStr, 10);
    const stageNumber = parseInt(stageStr, 10);

    let numRuns = 3000;
    let idolNameInput = "";
    let planInput = "";

    // Check if second argument is a number
    if (!isNaN(parseInt(args[1], 10))) {
        numRuns = parseInt(args[1], 10);
        idolNameInput = args[2].toLowerCase();
        planInput = args[3] ? args[3].toLowerCase() : "";
    } else {
        idolNameInput = args[1].toLowerCase();
        planInput = args[2] ? args[2].toLowerCase() : "";
    }

    if (!planInput) {
        console.error("プランの指定は必須です (例: sense, logic, anomaly)");
        process.exit(1);
    }

    // 1. Load Stage
    const stages = Stages.getAll();
    const contestStage = stages.find((s) => s.type == "contest" && s.season == season && s.stage == stageNumber);

    if (!contestStage) {
        console.error(`ステージが見つかりません: シーズン${season} ステージ${stageNumber}`);
        process.exit(1);
    }

    // 2. Identify Idol
    const idolId = IDOL_NAME_TO_ID[idolNameInput];
    if (!idolId) {
        console.error(`アイドルが見つかりません: ${idolNameInput}`);
        process.exit(1);
    }
    const realIdolName = Idols.getById(idolId).name;

    console.log(`\n=== メモリー合成シミュレーション開始 ===`);
    console.log(`アイドル: ${realIdolName} (${planInput})`);
    console.log(`ステージ: シーズン${season}-${stageNumber}`);
    console.log(`試行回数: ${numRuns}回 (各評価)`);

    // 3. Phase 1: Find Best Memory Combination from DB
    console.log("\n[既存メモリーの最適化 (Best Memory Search)]");
    const bestBase = await findBestMemoryCombination({
        season, stageNumber, numRuns: Math.min(100, numRuns), // Lower runs for combinatorial search speed? Or keep user num?
        // User specified numRuns might be for the Phase 2 precision.
        // Combinatorial search usually needs fewer runs per comb to identify candidate, but 100 is safe default for search.
        // Let's use user numRuns but capped for search if it's huge? No, consistent is better.
        // Actually, opt-remote defaults to user arg.
        numRuns,
        idolName: idolNameInput,
        plan: planInput,
        contestStage
    });

    if (!bestBase) {
        console.error("有効なメモリーの組み合わせが見つかりませんでした。終了します。");
        process.exit(1);
    }

    console.log(`-> 最強の組み合わせ特定: ${Math.round(bestBase.score)}`);
    console.log(`   Main: ${bestBase.mainName} (${bestBase.mainFilename})`);
    console.log(`   Sub : ${bestBase.subName} (${bestBase.subFilename})`);

    // Prepare Base Loadout Data
    // We need to fetch the Full Memory Data for Main/Sub to reconstruct the loadout params/cards
    // The result from findBestMemoryCombination already has main/sub DATA attached if we modify the return.
    // Let's ensure findBestMemoryCombination returns the data objects.

    const mainMemData = bestBase.mainData;
    const subMemData = bestBase.subData;

    // 4. Phase 2: Memory Synthesis Simulation
    console.log("\n[メモリー合成シミュレーション (Synthesis Check)]");

    // Load Candidate Cards
    const AllSkillCards = loadJson("skill_cards.json");
    const candidateCards = AllSkillCards.filter(c => {
        // Synthesis candidates: Plan matches (or free), Source is produce
        // "入れ替え候補となるスキルカードは...候補からランダム" -> But we can choose any card *available* in the game? 
        // No, "The USER wants to know... which replacement is good".
        // The user effectively "wants to know which synthesis result to aim for".
        // So we test ALL valid cards in the game as potential synthesis results.
        const planMatch = c.plan === "free" || c.plan === planInput;
        return planMatch && c.sourceType === "produce" && c.rarity !== "N"; // Usually R/SR/SSR
    });

    console.log(`合成候補カード種別数: ${candidateCards.length}枚`);

    // Define slots to test (Indices 1, 2, 3, 4 -> 2nd to 5th cards)
    const testSlots = [1, 2, 3, 4];

    // Targets: Main and Sub
    const targets = [
        { name: "Main", data: mainMemData, type: "main" },
        { name: "Sub", data: subMemData, type: "sub" }
    ];

    const synthesisResults = [];

    // Worker Context for Phase 2
    const workerContext = {
        contestStage,
        numRuns
    };

    // We process each target (Main/Sub) -> each slot -> each candidate
    // Generate all tasks first?
    const tasks = [];

    for (const target of targets) {
        const originalCards = target.data.skillCardIds; // Array of IDs

        for (const slotIndex of testSlots) {
            // Check if slot exists (length check)
            if (slotIndex >= originalCards.length) continue;

            const originalCardId = originalCards[slotIndex];
            const originalCard = AllSkillCards.find(c => c.id === originalCardId);
            const originalCardName = originalCard ? originalCard.name : `ID:${originalCardId}`;

            // Create tasks for each candidate
            for (const candidate of candidateCards) {
                // Don't replace with same card
                if (candidate.id === originalCardId) continue;
                // Don't replace with same NAME (Synthesis rule: cannot obtain same name card)
                if (originalCard && candidate.name === originalCard.name) continue;
                // Rule: Candidate rarity <= Original rarity? 
                // "入れ替え候補とレアリティが同一か、それよりもレアリティが低いスキルカードから選出"
                // Wait, this rule applies to "Customize" synthesis?
                // "入れ替え候補となるスキルカードは...ランダムで選出されます。獲得できる...は合成元の...レアリティ...より上にはなりません"
                // So result rarity <= original rarity.
                // We should filter candidates by this rule.

                // Rarity check
                if (getRarityValue(candidate.rarity) > getRarityValue(originalCard.rarity)) continue;

                tasks.push({
                    targetType: target.type, // 'main' or 'sub'
                    slotIndex,
                    originalCardName,
                    candidateCard: candidate,
                    baseScore: bestBase.score
                });
            }
        }
    }

    console.log(`総シミュレーションパターン数: ${tasks.length}`);
    if (tasks.length === 0) {
        console.log("合成可能な候補がありませんでした。");
        return;
    }

    // Run Batch Simulation
    const results = await runSynthesisBatch(tasks, workerContext, mainMemData, subMemData);

    // Filter improvements
    const improvements = results.filter(r => r.score > bestBase.score);
    improvements.sort((a, b) => b.score - a.score);

    // Report
    console.log("\n[合成おすすめ提案 (Top 10)]");
    if (improvements.length === 0) {
        console.log("スコアが向上する合成は見つかりませんでした。");
    } else {
        console.log("| 対象 | スロット | 元カード | 新カード | 予想スコア | 差分 |");
        console.log("| :-- | :-- | :-- | :-- | --: | --: |");
        improvements.slice(0, 10).forEach(res => {
            const diff = Math.round(res.score - bestBase.score);
            console.log(`| ${res.targetType} | ${res.slotIndex + 1} | ${res.originalCardName} | ${res.candidateCard.name} | ${Math.round(res.score)} | +${diff} |`);
        });
    }
}

function getRarityValue(rarity) {
    switch (rarity) {
        case "SSR": return 4;
        case "SR": return 3;
        case "R": return 2;
        case "N": return 1;
        default: return 0;
    }
}

// --- Phase 1 Logic ---

async function findBestMemoryCombination(options) {
    const { season, stageNumber, numRuns, idolName, plan, contestStage } = options;
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is required for phase 1.");
    }


    // Wait, optimize-memories-parallel has run() at bottom, it executes on import!
    // We cannot import it safely without refactoring it.
    // I MUST Duplicate the logic here or I will trigger execution.
    // I will Duplicate loadMemoriesFromDB logic here.

    const client = new MongoClient(MONGODB_URI);
    let memories = [];
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || "gakumas-tools");
        const collection = db.collection("memories");

        // Logic from optimize-memories-parallel.mjs
        let query = {};

        // Resolve idol ID
        const idolId = IDOL_NAME_TO_ID[idolName]; // Assuming single idol
        const { PIdols } = await import("./lib/gakumas-data/index.js");

        // Find pIdolIds matching plan AND idol
        const targetPIdols = PIdols.getAll().filter(p => p.idolId === idolId && p.plan === plan);
        const pIdolIds = targetPIdols.map(p => p.id);

        query.pIdolId = { $in: pIdolIds };

        const rawMemories = await collection.find(query).toArray();
        memories = rawMemories.map(m => ({
            filename: m._id.toString(),
            data: m
        }));

    } finally {
        await client.close();
    }

    if (memories.length === 0) return null;

    console.log(`取得メモリー数: ${memories.length}`);

    // Generate Combinations
    const combinations = [];
    for (const mainMem of memories) {
        for (const subMem of memories) {
            if (mainMem.filename === subMem.filename) continue;
            combinations.push({ main: mainMem, sub: subMem });
        }
    }

    if (combinations.length === 0) return null;
    console.log(`評価組み合わせ数: ${combinations.length}`);

    // Reuse optimize-worker.mjs
    const cpuCount = Math.max(1, os.cpus().length);
    const chunkSize = Math.ceil(combinations.length / cpuCount);
    const chunks = [];
    for (let i = 0; i < combinations.length; i += chunkSize) {
        chunks.push(combinations.slice(i, i + chunkSize));
    }

    const workers = [];
    let completed = 0;
    const results = [];

    const promises = chunks.map((chunk, index) => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'optimize-worker.mjs'), {
                workerData: { contestStage, numRuns }
            });
            workers.push(worker);

            worker.on('message', (msg) => {
                if (msg.type === 'progress') {
                    completed += msg.count;
                    process.stdout.write(`\rPhase 1 Progress: ${completed}/${combinations.length}`);
                } else if (msg.type === 'done') {
                    results.push(...msg.results);
                    resolve();
                }
            });
            worker.on('error', reject);
            worker.on('exit', code => { if (code !== 0) reject(new Error(`Worker ${code}`)); });

            worker.postMessage({ id: index, combinations: chunk });
        });
    });

    try {
        await Promise.all(promises);
    } finally {
        workers.forEach(w => w.terminate());
    }
    process.stdout.write("\n");

    results.sort((a, b) => b.score - a.score);
    const best = results[0];

    // Attach Data
    best.mainData = memories.find(m => m.filename === best.mainFilename).data;
    best.subData = memories.find(m => m.filename === best.subFilename).data;

    return best;
}

// --- Phase 2 Logic ---

async function runSynthesisBatch(tasks, context, mainMemData, subMemData) {
    const cpuCount = Math.max(1, os.cpus().length);
    const chunkSize = Math.ceil(tasks.length / cpuCount);
    const chunks = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
        chunks.push(tasks.slice(i, i + chunkSize));
    }

    const workers = [];
    const results = [];
    let completed = 0;

    const promises = chunks.map((chunk, index) => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'simulate-loadout-worker.mjs'), {
                workerData: {
                    contestStage: context.contestStage,
                    numRuns: context.numRuns
                }
            });
            workers.push(worker);

            // Convert tasks to loadouts for the worker
            const loadouts = chunk.map((task, i) => {
                // Construct Combined Loadout for this task
                const baseMainCards = [...mainMemData.skillCardIds];
                const baseSubCards = [...subMemData.skillCardIds];

                // Apply Synthesis substitution
                if (task.targetType === "main") {
                    baseMainCards[task.slotIndex] = task.candidateCard.id;
                } else {
                    baseSubCards[task.slotIndex] = task.candidateCard.id;
                }

                // Construct Params (Main + Sub*0.2)
                const mainParams = mainMemData.params;
                const subParams = subMemData.params;
                const combinedParams = mainParams.map((p, k) => p + Math.floor((subParams[k] || 0) * 0.2));

                const combinedCustomizations = [
                    mainMemData.customizations || [{}, {}, {}, {}, {}, {}],
                    subMemData.customizations || [{}, {}, {}, {}, {}, {}]
                ];
                // Note: if card changed, customization for that slot should be reset?
                // "使用するメモリーのカスタマイズ済みのスキルカードは候補になりません"
                // -> "カスタマイズしていないスキルカードを変更対象にしている場合、使用するメモリーのカスタマイズ済みのスキルカードは候補になりません"
                // The rules are complex.
                // Assuming "Synthesis" implies REPLACING the card, effectively obtaining a NEW card in that slot.
                // The new card comes from the "Material" memory (which we are mocking by picking from All Candidates).
                // A new card from synthesis typically has NO customization (unless it's a specific inheritance? No, usually fresh).
                // So we should Reset Customization for the modified slot.
                if (task.targetType === "main") {
                    combinedCustomizations[0][task.slotIndex] = {};
                } else {
                    combinedCustomizations[1][task.slotIndex] = {};
                }

                return {
                    id: `${index}-${i}`,
                    params: combinedParams,
                    pItemIds: mainMemData.pItemIds, // Sub items don't contribute? Usually only Main items active.
                    skillCardIdGroups: [baseMainCards, baseSubCards],
                    customizationGroups: combinedCustomizations,
                    // Pass task metadata to map back later if needed, but worker ignores extra props
                    // optimizing-deck.mjs stored 'ind' to map back.
                };
            });

            worker.on('message', (msg) => {
                if (msg.type === 'done') {
                    // msg.results has { id, score ... }
                    msg.results.forEach(res => {
                        // Find corresponding task
                        const [chunkIdx, taskIdx] = res.id.split('-').map(Number);
                        const originalTask = chunk[taskIdx];
                        results.push({
                            ...originalTask,
                            score: res.score
                        });
                    });

                    completed += msg.results.length;
                    process.stdout.write(`\rPhase 2 Progress: ${completed}/${tasks.length}`);

                    resolve();
                }
            });
            worker.on('error', reject);
            worker.on('exit', code => { if (code !== 0) reject(new Error(`Worker ${code}`)); });

            worker.postMessage({ id: index, loadouts });
        });
    });

    try {
        await Promise.all(promises);
    } finally {
        workers.forEach(w => w.terminate());
    }
    process.stdout.write("\n");
    return results;
}

run();
