import { Stages, PIdols, Idols, SkillCards } from "gakumas-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import os from 'os';
import { MongoClient } from "mongodb";
import crypto from "crypto";
import { recommendSynthesis } from "./optimize-synthesis.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDOL_NAME_TO_ID = {
    "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
    "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
};

// Canonical list for 'all' keyword
const ALL_IDOL_NAMES = [
    "saki", "temari", "kotone", "tsubame", "mao", "lilja", "china",
    "sumika", "hiro", "sena", "misuzu", "ume", "rinami"
];

function calculateMemoryHash(memoryData) {
    const parts = [
        memoryData.pIdolId,
        JSON.stringify(memoryData.params),
        JSON.stringify(memoryData.pItemIds),
        JSON.stringify(memoryData.skillCardIds),
        JSON.stringify(memoryData.customizations || [{}, {}, {}, {}, {}, {}])
    ];
    return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function deriveRunMeta(loadout) {
    const { stageId, customStage, skillCardIdGroups } = loadout;

    let stageName = null;
    let season = null;
    if (stageId === "custom") {
        stageName = customStage?.name || "Custom";
    } else if (stageId) {
        const stage = Stages.getById(stageId);
        if (stage) {
            stageName = stage.name;
            season = stage.season || null;
        }
    }

    let signatureCardId = null;
    let pIdolId = null;
    const firstGroup = skillCardIdGroups?.[0] || [];
    for (const id of firstGroup) {
        if (!id) continue;
        const card = SkillCards.getById(id);
        if (card?.sourceType === "pIdol") {
            signatureCardId = id;
            pIdolId = card.pIdolId;
            break;
        }
    }
    if (!signatureCardId) {
        for (const id of firstGroup) {
            if (!id) continue;
            signatureCardId = id;
            const card = SkillCards.getById(id);
            if (card?.pIdolId) pIdolId = card.pIdolId;
            break;
        }
    }

    let idolId = null;
    if (pIdolId) {
        const pIdol = PIdols.getById(pIdolId);
        if (pIdol) idolId = pIdol.idolId;
    }

    return {
        stageName,
        season,
        idolId,
        pIdolId,
        signatureCardId,
    };
}

async function run() {
    const rawArgs = process.argv.slice(2);

    // Parse args manually to support options
    const args = [];
    const options = {};
    for (let i = 0; i < rawArgs.length; i++) {
        if (rawArgs[i].startsWith("--")) {
            const key = rawArgs[i].substring(2);
            const value = rawArgs[i + 1] && !rawArgs[i + 1].startsWith("--") ? rawArgs[i + 1] : true;
            options[key] = value;
            if (value !== true) i++;
        } else {
            args.push(rawArgs[i]);
        }
    }

    const filterHashesRaw = options.filterHashes;
    let allowedHashes = null;
    let allowedHashPairs = null; // For surgical delete
    if (filterHashesRaw) {
        try {
            const parsed = JSON.parse(filterHashesRaw);
            if (Array.isArray(parsed)) {
                if (typeof parsed[0] === 'string') {
                    allowedHashes = new Set(parsed);
                } else if (typeof parsed[0] === 'object' && parsed[0].mainHash) {
                    allowedHashes = new Set(parsed.map(p => `${p.mainHash}_${p.subHash}`));
                    allowedHashPairs = parsed;
                }
            }
        } catch (e) {
            // If it's a file path
            if (fs.existsSync(filterHashesRaw)) {
                const parsed = JSON.parse(fs.readFileSync(filterHashesRaw, 'utf8'));
                if (Array.isArray(parsed)) {
                    if (typeof parsed[0] === 'string') {
                        allowedHashes = new Set(parsed);
                    } else if (typeof parsed[0] === 'object' && parsed[0].mainHash) {
                        allowedHashes = new Set(parsed.map(p => `${p.mainHash}_${p.subHash}`));
                        allowedHashPairs = parsed;
                    }
                }
            }
        }
    }

    if (args.length < 3) {
        console.error("使用法: node local-scripts/optimize-memories-parallel.mjs <source> <season-stage> <num_runs> [options]");
        console.error("  <source>: ディレクトリパス または MongoDB URI (mongodb://...)");
        console.error("  <options>: --idolName <name>, --plan <sense|logic|anomaly> (DBモード時のみ有効), --showWorst (低スコアワースト10を表示), --force (キャッシュを無視して再計算), --save, --name <name>, --userId <id>, --supportBonus <value>");
        process.exit(1);
    }

    const source = args[0];

    // Capture console.log/error if we are in JSON mode to prevent noise
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    if (options.json) {
        console.log = () => { };
        // console.error = () => { }; // Keep stderr for debug logs
    }
    const [seasonStr, stageStr] = args[1].split("-");
    const season = parseInt(seasonStr, 10);
    const stageNumber = parseInt(stageStr, 10);

    let numRuns = parseInt(args[2], 10);

    // Check if args[2] was purely a number, or if it contained extra text (e.g. "100　all" due to full-width space)
    const runsStr = String(numRuns);
    if (!isNaN(numRuns) && args[2] && args[2] != runsStr) {
        // There is extra content. Be robust and try to find idolName/all in it.
        // Replace full-width space with half-width space and trim
        const fixedArg = args[2].replace(/　/g, ' ').trim();
        // Remove the number part
        const remainder = fixedArg.replace(new RegExp(`^${runsStr}\\s*`), "").toLowerCase();

        if (remainder === 'all' || IDOL_NAME_TO_ID[remainder]) {
            console.error(`警告: 引数 '${args[2]}' に余分な文字列が含まれていますが、アイドル指定 '${remainder}' として解釈しました。`);
            if (!options.idolName) {
                options.idolName = remainder;
            }
        }
    }

    if (isNaN(numRuns)) {
        // Fallback: Check if args[2] is an idol name or 'all'
        const candidate = args[2] ? args[2].toLowerCase() : "";
        if (candidate === 'all' || IDOL_NAME_TO_ID[candidate]) {
            console.error(`試行回数が指定されていません。デフォルト値(3000)を使用し、'${args[2]}' をアイドル指定として扱います。`);
            numRuns = 3000;
            // Override options.idolName if not already set (though CLI arg usually handles this matches logic)
            if (!options.idolName) {
                options.idolName = candidate;
            }
        } else {
            console.error(`エラー: 試行回数 '${args[2]}' が不正です。数値または有効なアイドル名を指定してください。`);
            process.exit(1);
        }
    }

    // Load Stage
    const stages = Stages.getAll();
    const contestStage = stages.find((s) => s.type == "contest" && s.season == season && s.stage == stageNumber);

    if (!contestStage) {
        console.error(`ステージが見つかりません: シーズン${season} ステージ${stageNumber}`);
        process.exit(1);
    }

    // Auto-detect plan from stage definition if not provided
    if (!options.plan && contestStage.plan && contestStage.plan !== 'free') {
        options.plan = contestStage.plan;
        console.error(`ステージ情報からプランを自動設定しました: ${options.plan}`);
    }

    // Safety Check: Require idolName for MongoDB sources
    if (source.startsWith("mongodb://") && !options.idolName) {
        console.error("エラー: MongoDBモードではアイドル名の指定が必須です。(全アイドル対象の場合は 'all' を指定してください)");
        process.exit(1);
    }

    // Determine execution plan
    let idolNames = [null];
    if (options.idolName) {
        if (options.idolName.toLowerCase() === 'all') {
            idolNames = ALL_IDOL_NAMES;
        } else {
            idolNames = options.idolName.split(",").map(s => s.trim());
        }
    }

    let supportBonusRaw = parseFloat(options.supportBonus || process.env.SUPPORT_BONUS || "0.04");
    let supportBonus = supportBonusRaw >= 1.0 ? supportBonusRaw / 100 : supportBonusRaw;
    // Normalize to 4 decimal places to match GUI behavior
    supportBonus = parseFloat(supportBonus.toFixed(4));

    const allIdolsOutputData = [];

    async function executeSimulation(stage, runs, bonus, mems, workers, opts, filter, skip) {
        const results = [];
        const promises = [];
        const activeWorkers = [];
        let completed = 0;
        const mainCount = mems.length;
        const chunkSize = Math.ceil(mainCount / workers);

        for (let i = 0; i < mainCount; i += chunkSize) {
            const start = i;
            const end = Math.min(i + chunkSize, mainCount);

            promises.push(new Promise((resolve, reject) => {
                const worker = new Worker(path.join(__dirname, 'worker-boot.mjs'), {
                    workerData: {
                        contestStage: stage,
                        numRuns: runs,
                        supportBonus: bonus,
                        memories: mems
                    }
                });

                worker.on('message', (msg) => {
                    if (msg.type === 'progress') {
                        completed += msg.count;
                        const approxTotal = mainCount * mems.length;
                        if (completed % 50 === 0 || completed === approxTotal) {
                            process.stderr.write(`\r- 進捗: ${completed}/${approxTotal} (${Math.round(completed / approxTotal * 100)}%)`);
                        }
                    } else if (msg.type === 'done') {
                        results.push(...msg.results);
                        resolve();
                    }
                });

                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                });

                worker.postMessage({
                    startIndex: start,
                    endIndex: end,
                    filterHashes: filter ? Array.from(filter) : null,
                    skipHashes: skip ? Array.from(skip) : null
                });
                activeWorkers.push(worker);
            }));
        }

        try {
            if (mainCount > 0) await Promise.all(promises);
        } finally {
            for (const w of activeWorkers) w.terminate();
        }
        return results;
    }

    async function saveResultsToCache(results, runs, stageId, season, bonus, useCache, simulationResultsCollection) {
        if (!useCache || !simulationResultsCollection || results.length === 0) return;
        
        console.error(`\n新規結果 ${results.length} 件 (試行回数: ${runs}) をDBに保存中... (BulkWrite開始)`);
        const _dbWriteStart = Date.now();
        
        const bulkOps = results.map(res => ({
            updateOne: {
                filter: {
                    mainHash: res.mainHash,
                    subHash: res.subHash,
                    stageId: stageId,
                    runs: runs,
                    season: season,
                    supportBonus: bonus
                },
                update: {
                    $set: {
                        mainHash: res.mainHash,
                        subHash: res.subHash,
                        stageId: stageId,
                        runs: runs,
                        season: season,
                        supportBonus: bonus,
                        score: res.score,
                        min: res.min,
                        max: res.max,
                        median: res.median,
                        q1: res.q1,
                        q3: res.q3,
                        mainName: res.mainName,
                        subName: res.subName,
                        mainFilename: res.mainFilename,
                        subFilename: res.subFilename,
                        createdAt: new Date(),
                        stats: res.stats
                    }
                },
                upsert: true
            }
        }));

        try {
            const chunkSize = 200;
            for (let i = 0; i < bulkOps.length; i += chunkSize) {
                const chunk = bulkOps.slice(i, i + chunkSize);
                await simulationResultsCollection.bulkWrite(chunk, { ordered: false });
            }
            const _dbBulkOpEnd = Date.now();
            console.error(`...DB保存完了: ${(_dbBulkOpEnd - _dbWriteStart) / 1000}秒`);
        } catch (e) {
            console.error("DB Save Error:", e);
        }
    }

    for (const currentIdolName of idolNames) {
        if (currentIdolName) console.error(`\n========== アイドル: ${currentIdolName} の処理開始 ==========`);
        console.error(`Support Bonus: ${(supportBonus * 100).toFixed(2)}%`);

        // Load Memories
        let memories = [];
        if (source.startsWith("mongodb://")) {
            console.error("MongoDBからメモリーを読み込み中...");
            // Pass single idol name
            const currentOptions = { ...options, idolName: currentIdolName };
            memories = await loadMemoriesFromDB(source, currentOptions);
        } else {
            if (!fs.existsSync(source)) {
                console.error(`スキップ: ディレクトリが見つかりません: ${source}`);
                continue;
            }
            const memoryFiles = fs.readdirSync(source).filter(f => f.endsWith(".json"));
            console.error(`${memoryFiles.length} ファイルのメモリーを読み込み中...`);
            memories = memoryFiles.map(f => ({
                filename: f,
                data: JSON.parse(fs.readFileSync(path.join(source, f), "utf8"))
            }));
        }

        // Calculate Hashes
        memories.forEach(m => {
            m.hash = calculateMemoryHash(m.data);
        });

        if (memories.length === 0) {
            console.error("対象のメモリーが見つかりませんでした。スキップします。");
            continue;
        }

        // Connect to DB for Caching (Scope: Current Idol Loop)
        let mongoClient;
        let simulationResultsCollection;
        const useCache = !!process.env.MONGODB_URI;

        if (useCache) {
            try {
                mongoClient = new MongoClient(process.env.MONGODB_URI);
                await mongoClient.connect();
                const db = mongoClient.db(process.env.MONGODB_DB || "gakumas-tools");
                simulationResultsCollection = db.collection("simulation_results");

                // Ensure compound index exists for ultra-fast bulk upserts (background prevents blocking)
                await simulationResultsCollection.createIndex(
                    { mainHash: 1, subHash: 1, stageId: 1, runs: 1, season: 1 },
                    { background: true, name: "cache_upsert_index" }
                );

                if (options.force) {
                    const deleteQuery = {
                        stageId: contestStage.id,
                        runs: numRuns,
                        season: season,
                        supportBonus: { $gte: supportBonus - 0.0001, $lte: supportBonus + 0.0001 }
                    };
                    if (allowedHashPairs) {
                        deleteQuery.$or = allowedHashPairs.map(p => ({ mainHash: p.mainHash, subHash: p.subHash }));
                        console.error(`--force 指定 (部分): 指定された ${allowedHashPairs.length} 組のキャッシュを削除します...`);
                    } else if (allowedHashes && allowedHashes.size > 0) {
                        deleteQuery.$or = Array.from(allowedHashes).map(h => {
                            const [main, sub] = h.split("_");
                            return { mainHash: main, subHash: sub };
                        });
                        console.error(`--force 指定 (部分): 指定された ${allowedHashes.size} 組のキャッシュを削除します...`);
                    } else {
                        console.error(`--force 指定: キャッシュを削除します... (Stage ID: ${contestStage.id}, Runs: ${numRuns}, Season: ${season}, Bonus: ${supportBonus})`);
                    }
                    const delRes = await simulationResultsCollection.deleteMany(deleteQuery);
                    console.error(`削除完了: ${delRes.deletedCount} 件のキャッシュを削除しました。`);
                }
            } catch (e) {
                console.error("Cache DB Connection Error:", e);
            }
        }

        // Determine Worker Count
        const cpuCount = os.cpus().length;
        const workerCount = Math.max(1, cpuCount);

        // Progress Output -> stderr
        console.error("---");
        console.error("## 進捗");
        console.error(`- ソース: ${source.startsWith("mongodb://") ? "MongoDB" : "ローカルファイル"}`);
        if (currentIdolName) console.error(`- アイドルフィルタ: ${currentIdolName}`);
        if (options.plan) console.error(`- プランフィルタ: ${options.plan}`);
        console.error(`- 読み込みメモリー数: ${memories.length} 件`);
        console.error(`- 並列実行数: ${workerCount} スレッド`);
        console.error(`- ステージ: シーズン${season} ステージ${stageNumber}`);
        console.error(`- 試行回数: ${numRuns} 回/組`);
        console.error("- シミュレーション開始... (時間がかかります)");

        // Split work based on main memories
        const mainCount = memories.length;
        const chunkSize = Math.ceil(mainCount / workerCount);

        // Pre-simulation Cache Lookup (Skip already simulated combinations)
        let skipHashes = null;
        let cachedPhase1Results = [];
        if (useCache && simulationResultsCollection && !options.force) {
            const memHashes = memories.map(m => m.hash);
            const checkRuns = options.step ? Math.max(1, Math.floor(numRuns / 10)) : numRuns;
            const query = {
                stageId: contestStage.id,
                runs: { $gte: checkRuns },
                season: season,
                supportBonus: { $gte: supportBonus - 0.0001, $lte: supportBonus + 0.0001 },
                mainHash: { $in: memHashes },
                subHash: { $in: memHashes }
            };
            try {
                const cached = await simulationResultsCollection.find(query).toArray();
                if (cached.length > 0) {
                    console.error(`キャッシュから ${cached.length} 件の結果を読み込みました。スキップします。 (基準試行回数: ${checkRuns})`);
                    skipHashes = cached.map(r => `${r.mainHash}_${r.subHash}`);
                    if (options.step) {
                        cachedPhase1Results = cached.map(r => ({
                            mainHash: r.mainHash,
                            subHash: r.subHash,
                            score: r.score,
                            min: r.min,
                            max: r.max,
                            median: r.median,
                            q1: r.q1,
                            q3: r.q3,
                            mainName: r.mainName,
                            subName: r.subName,
                            mainFilename: r.mainFilename,
                            subFilename: r.subFilename,
                            stats: r.stats
                        }));
                    }
                }
            } catch (e) {
                console.error("Cache pre-lookup error:", e);
            }
        }

        // Run Workers
        let completedCount = 0;
        const allResults = [];
        const workers = [];

        const startTime = Date.now();

        let phase1Results = [];
        let isPhase2 = false;

        let tournament_metadata = null;

        if (options.step) {
            console.error(`\n[ステップ実行] フェーズ1: スクリーニング (${Math.max(1, Math.floor(numRuns / 10))} 試行)...`);
            const p1Runs = Math.max(1, Math.floor(numRuns / 10));
            const newPhase1Results = await executeSimulation(contestStage, p1Runs, supportBonus, memories, workerCount, options, allowedHashes, skipHashes);
            
            // Phase 1の結果をキャッシュに保存 (新規分のみ)
            await saveResultsToCache(newPhase1Results, p1Runs, contestStage.id, season, supportBonus, useCache, simulationResultsCollection);

            // キャッシュ分と新規分を統合して Top 5 を選出
            phase1Results = [...newPhase1Results, ...cachedPhase1Results];

            phase1Results.sort((a, b) => b.score - a.score);
            const top5 = phase1Results.slice(0, 5);
            if (top5.length === 0) {
                console.error("フェーズ1で候補が見つかりませんでした。スキップします。");
                if (mongoClient) await mongoClient.close();
                continue;
            }

            console.error(`\n[ステップ実行] フェーズ2: 本シミュレーション (トップ${top5.length}組, ${numRuns} 試行, --force)...`);
            const p2FilterHashes = top5.map(c => `${c.mainHash}_${c.subHash}`);
            isPhase2 = true;
            // Phase 2 always uses force
            const p2Options = { ...options, force: true };
            const p2Results = await executeSimulation(contestStage, numRuns, supportBonus, memories, workerCount, p2Options, new Set(p2FilterHashes), null);
            allResults.push(...p2Results);
            
            // Phase 2の結果もキャッシュに保存
            await saveResultsToCache(p2Results, numRuns, contestStage.id, season, supportBonus, useCache, simulationResultsCollection);

            tournament_metadata = {
                phase1Runs: p1Runs,
                phase2Runs: numRuns,
                prunedCount: phase1Results.length - top5.length,
                totalCombinations: phase1Results.length
            };
        } else {
            const results = await executeSimulation(contestStage, numRuns, supportBonus, memories, workerCount, options, allowedHashes, skipHashes);
            allResults.push(...results);
            // 通常実行の結果をキャッシュに保存
            await saveResultsToCache(results, numRuns, contestStage.id, season, supportBonus, useCache, simulationResultsCollection);
        }

        // Merge with Cached Results for Display
        if (useCache && simulationResultsCollection) {
            // Fetch ALL results for this set (cache + new)
            // Re-query simply or assume we have everything?
            // We only skipped ones that match (mainHash, subHash) from `memories`.
            // So we should construct the list of relevant hashes to fetch?
            // Or just fetch all for this stage/runs again? (Might be large if many idols)
            // Better: We know which ones we skipped.

            // To be safe and simple: Fetch all results where `mainHash` IN (memories.hashes) AND `subHash` IN (memories.hashes)
            const memHashes = memories.map(m => m.hash);
            const finalQuery = {
                stageId: contestStage.id,
                runs: { $gte: numRuns },
                season: season,
                supportBonus: { $gte: supportBonus - 0.0001, $lte: supportBonus + 0.0001 },
                mainHash: { $in: memHashes },
                subHash: { $in: memHashes }
            };

            try {
                const cachedResultsRaw = await simulationResultsCollection.find(finalQuery).sort({ runs: -1 }).toArray();

                // Deduplicate by (mainHash, subHash) keeping the highest runs
                const seen = new Set();
                const cachedMapped = [];
                for (const r of cachedResultsRaw) {
                    const key = `${r.mainHash}_${r.subHash}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        cachedMapped.push({
                            mainFilename: r.mainFilename,
                            mainName: r.mainName,
                            subFilename: r.subFilename,
                            subName: r.subName,
                            score: r.score,
                            min: r.min,
                            max: r.max,
                            median: r.median,
                            q1: r.q1,
                            q3: r.q3,
                            mainHash: r.mainHash,
                            subHash: r.subHash,
                            stats: r.stats
                        });
                    }
                }

                // Deduplicate?
                // `allResults` are definitely new and unique.
                // `cachedResults` might include everything if we queried broad?
                // Actually `allResults` are NOT in DB yet when we query? 
                // Wait, I saved them just above.
                // So `cachedResults` SHOULD contain `allResults` too now.

                // Let's use `cachedMapped` to supplement allResults
                // We prioritize newly calculated results in `allResults`
                const seenKeys = new Set(allResults.map(r => `${r.mainHash}_${r.subHash}`));
                for (const r of cachedMapped) {
                    const key = `${r.mainHash}_${r.subHash}`;
                    if (!seenKeys.has(key)) {
                        allResults.push(r);
                    }
                }

                // Rehydrate meta for all results
                for (const res of allResults) {
                    const mem = memories.find(m => m.hash === res.mainHash); // hash check is safer than filename if we want robust
                    // Or filename? Filename should be unique per run.
                    if (mem) {
                        res.meta = mem.data.meta || {};
                        // Actually `main.meta` in worker was `main.meta`. 
                        // `memories` items are `{ filename, data, hash }`.
                        // `data` has `meta`? No, `data` is the JSON content.
                        // `loadMemoriesFromDB` returns `data: m`. `m` might have meta?
                        // `memories` from file: `data: JSON.parse(...)`.
                        // Currently meta is not strictly used in existing code EXCEPT `synth` option logic.
                        // `synth` logic checks `options.synth` and uses `memories` array to find `mainMem` and `subMem`.
                    }
                }

            } catch (e) {
                console.error("Error fetching combined results:", e);
            }

            if (mongoClient) await mongoClient.close();
        }

        const duration = (Date.now() - startTime) / 1000;
        console.error(`\n- 完了! 処理時間: ${duration.toFixed(1)}秒`);
        console.error("---");
        // End of Progress Output (stderr)

        // Start of Report Output (stdout)
        allResults.sort((a, b) => b.score - a.score);

        if (options.json) {
            // JSON Output Mode
            const best = allResults[0] || {};
            const finalOutputData = {
                best: {
                    score: best.score,
                    mainFilename: best.mainFilename,
                    subFilename: best.subFilename,
                    mainTitle: "", // Will populate below
                    subTitle: "",
                    idolName: currentIdolName,
                    mainName: best.mainName,
                    subName: best.subName,
                    mainHash: best.mainHash,
                    subHash: best.subHash
                },
                topCombinations: allResults.slice(0, 5).map(res => {
                    const mainMem = memories.find(m => m.hash === res.mainHash);
                    const subMem = memories.find(m => m.hash === res.subHash);
                    return {
                        idolName: currentIdolName,
                        mainName: res.mainName,
                        subName: res.subName,
                        mainTitle: mainMem ? (PIdols.getById(mainMem.data.pIdolId)?.title || "") : "",
                        subTitle: subMem ? (PIdols.getById(subMem.data.pIdolId)?.title || "") : "",
                        mainHash: res.mainHash,
                        subHash: res.subHash,
                        min: res.min,
                        q1: res.q1,
                        median: res.median,
                        q3: res.q3,
                        max: res.max,
                        score: res.score
                    };
                }),
                allResults: options.allResults ? allResults.map(res => ({
                    idolName: currentIdolName,
                    mainName: res.mainName,
                    subName: res.subName,
                    mainHash: res.mainHash,
                    subHash: res.subHash,
                    min: res.min,
                    q1: res.q1,
                    median: res.median,
                    q3: res.q3,
                    max: res.max,
                    score: res.score
                })) : [],
                totalCombinations: allResults.length,
                tournament_metadata,
                worstCombinations: [],
                synthResults: [],
                metadata: {
                    source,
                    season,
                    stage: stageNumber,
                    runs: numRuns,
                    idolName: currentIdolName,
                    plan: options.plan
                }
            };

            // Populate titles for best result
            const mainMem = memories.find(m => m.filename === best.mainFilename);
            const subMem = memories.find(m => m.filename === best.subFilename);
            if (mainMem && subMem) {
                const mainPIdol = PIdols.getById(mainMem.data.pIdolId);
                const subPIdol = PIdols.getById(subMem.data.pIdolId);
                const idol = mainPIdol ? Idols.getById(mainPIdol.idolId) : null;
                finalOutputData.best.idolName = idol ? idol.name.replace(" ", "") : (currentIdolName || "Unknown");
                finalOutputData.best.mainTitle = mainPIdol ? mainPIdol.title : "Unknown";
                finalOutputData.best.subTitle = subPIdol ? subPIdol.title : "Unknown";
            }

            if (options.showWorst || options.compare) {
                const memoryStats = {};
                for (const res of allResults) {
                    const key = res.mainFilename;
                    if (!memoryStats[key]) {
                        memoryStats[key] = {
                            filename: key,
                            name: res.mainName,
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
                // If compare mode, we might want all of them, or at least the ones matching pattern
                // For now, let's keep the name worstCombinations but include the matching ones
                memoryRanking.sort((a, b) => a.average - b.average);
                finalOutputData.worstCombinations = (options.compare ? memoryRanking : memoryRanking.slice(0, 10)).map(stat => ({
                    score: Math.round(stat.average),
                    amount: stat.count,
                    mainName: stat.name,
                    subName: "" // No subname in this summary view
                }));
            }

            // Synth not fully implemented in JSON object here to save complexity if not needed immediately
            // But if needed:
            if (options.synth && allResults.length > 0) {
                const best = allResults[0];
                const mainMem = memories.find(m => m.filename === best.mainFilename);
                const subMem = memories.find(m => m.filename === best.subFilename);

                if (mainMem && subMem) {
                    try {
                        const mainName = mainMem.data.name || "";
                        const subName = subMem.data.name || "";
                        const mainHasHammer = mainName.includes("🛠") || mainName.includes("⚒");
                        const subHasHammer = subName.includes("🛠") || subName.includes("⚒");

                        let targetMain = mainMem.data;
                        let targetSub = subMem.data;

                        if (!(mainHasHammer && subHasHammer)) {
                            if (mainHasHammer) {
                                targetMain = subMem.data;
                                targetSub = mainMem.data;
                            }

                            // Note: This is an async call, BUT we are not in an async function inside this block strictly speaking?
                            // optimize-memories-parallel.mjs `run()` is async. safely await.
                            // However, we need to check if we can await here. `run` is async. Yes.

                            const synthRes = await recommendSynthesis(targetMain, targetSub, contestStage.id, numRuns);

                            // Filter only improvements
                            const positiveRes = synthRes.filter(res => res.score > best.score);

                            finalOutputData.synthResults = positiveRes.slice(0, 10).map(res => ({
                                score: Math.round(res.score),
                                diff: Math.round(res.score - best.score),
                                startScore: Math.round(best.score),
                                newScore: Math.round(res.score),
                                result: {
                                    memories: [res.meta.originalName, res.meta.newName] // Simplified for now
                                },
                                meta: res.meta
                            }));
                        }
                    } catch (e) {
                        // console.error(e);
                    }
                }
            }

            // Save to MongoDB if --save is specified
            if (options.save && allResults.length > 0) {
                const saveCountRaw = options.save === true ? 1 : parseInt(options.save, 10) || 1;
                const saveCount = Math.min(Math.max(saveCountRaw, 1), 5); // min 1, max 5

                const mongoUri = source.startsWith("mongodb://") ? source : process.env.MONGODB_URI;
                if (!mongoUri) {
                    console.error("Error: MONGODB_URI is not set and source is not a MongoDB URI.");
                } else if (!options.userId && !process.env.CLI_USER_ID) {
                    console.error("Error: --save requires --userId or CLI_USER_ID environment variable.");
                } else {
                    const userId = options.userId || process.env.CLI_USER_ID;
                    const multiplier = 0.2;

                    let client;
                    try {
                        client = new MongoClient(mongoUri);
                        await client.connect();
                        const db = client.db(process.env.MONGODB_DB || "gakumas-tools");
                        const collection = db.collection("loadouts");

                        for (let rank = 0; rank < Math.min(saveCount, allResults.length); rank++) {
                            const best = allResults[rank];
                            const mainMem = memories.find(m => m.filename === best.mainFilename);
                            const subMem = memories.find(m => m.filename === best.subFilename);

                            if (!mainMem || !subMem) continue;

                            const mainPIdol = PIdols.getById(mainMem.data.pIdolId);
                            const idolId = mainPIdol ? mainPIdol.idolId : null;

                            let baseName = options.name;
                            if (!baseName) {
                                const now = new Date();
                                const yy = String(now.getFullYear()).slice(2);
                                const mm = String(now.getMonth() + 1).padStart(2, '0');
                                const dd = String(now.getDate()).padStart(2, '0');
                                baseName = `${yy}-${mm}-${dd}_${contestStage.season}-${contestStage.stage}_${currentIdolName}`;
                            }
                            const saveName = saveCount > 1 ? `${baseName}_${rank + 1}` : baseName;

                            const loadout = {
                                name: saveName,
                                stageId: contestStage.id,
                                customStage: {},
                                supportBonus,
                                params: mainMem.data.params.map((p, i) => (p || 0) + Math.floor((subMem.data.params[i] || 0) * multiplier)),
                                pItemIds: [...(mainMem.data.pItemIds || []), ...(subMem.data.pItemIds || [])],
                                skillCardIdGroups: [mainMem.data.skillCardIds, subMem.data.skillCardIds],
                                customizationGroups: [
                                    mainMem.data.customizations || [{}, {}, {}, {}, {}, {}],
                                    subMem.data.customizations || [{}, {}, {}, {}, {}, {}]
                                ],
                                userId,
                                createdAt: new Date(),
                                stats: best.stats,
                            };
                            loadout.derived = deriveRunMeta(loadout);

                            const result = await collection.insertOne(loadout);
                            console.error(`Loadout #${rank + 1} (${saveName}) saved successfully with ID: ${result.insertedId}`);
                        }
                    } catch (e) {
                        console.error("Failed to save loadout to MongoDB:", e);
                    } finally {
                        if (client) await client.close();
                    }
                }
            }

            // Add to the combined results for all idols
            allIdolsOutputData.push(finalOutputData);

            if (options.json) {
                originalConsoleLog(JSON.stringify(finalOutputData, null, 2));
            }

        } else {
            // Standard Text Output
            // Generate Custom Header
            if (allResults.length > 0) {
                const best = allResults[0];
                const mainMem = memories.find(m => m.filename === best.mainFilename);
                const subMem = memories.find(m => m.filename === best.subFilename);

                // Safety check if memories are found (should always be true)
                if (mainMem && subMem) {
                    const mainPIdol = PIdols.getById(mainMem.data.pIdolId);
                    const subPIdol = PIdols.getById(subMem.data.pIdolId);
                    const idol = mainPIdol ? Idols.getById(mainPIdol.idolId) : null;

                    const idolName = idol ? idol.name.replace(" ", "") : "Unknown";
                    const mainTitle = mainPIdol ? mainPIdol.title : "Unknown";
                    const subTitle = subPIdol ? subPIdol.title : "Unknown";

                    if (mainTitle === subTitle) {
                        console.log(`# ${idolName}【${mainTitle}】 - ベストスコア: ${Math.round(best.score)}`);
                    } else {
                        console.log(`# ${idolName}【${mainTitle}】【${subTitle}】 - ベストスコア: ${Math.round(best.score)}`);
                    }
                    console.log("");
                }
            }

            console.log("## ベストスコア(平均値): " + Math.round(allResults[0]?.score || 0));
            console.log("| メイン | サブ | 最小 | Q1 | 中央 | Q3 | 最大 | 平均 |");
            console.log("| :-- | :-- | --: | --: | --: | --: | --: | --: |");

            // Top 5 Combinations
            allResults.slice(0, 5).forEach((res) => {
                const mainMem = memories.find(m => m.hash === res.mainHash);
                const subMem = memories.find(m => m.hash === res.subHash);
                const mainTitle = mainMem ? (PIdols.getById(mainMem.data.pIdolId)?.title || "") : "";
                const subTitle = subMem ? (PIdols.getById(subMem.data.pIdolId)?.title || "") : "";

                const mainDisp = mainTitle ? `${res.mainName}【${mainTitle}】` : (res.mainName || "No Name");
                const subDisp = subTitle ? `${res.subName}【${subTitle}】` : (res.subName || "No Name");

                console.log(`| ${mainDisp} | ${subDisp} | ${Math.round(res.min)} | ${Math.round(res.q1)} | ${Math.round(res.median)} | ${Math.round(res.q3)} | ${Math.round(res.max)} | ${Math.round(res.score)} |`);
            });
            console.log(""); // Empty line before ---
            console.log("---");
            console.log("");

            // Memory Rankings (Average Score as Main) - Only if --showWorst is specified
            if (options.showWorst) {
                const memoryStats = {};
                for (const res of allResults) {
                    const key = res.mainFilename;
                    if (!memoryStats[key]) {
                        memoryStats[key] = {
                            filename: key,
                            name: res.mainName,
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

                console.log("## 低スコアメモリワースト10");
                console.log("| 平均値(メイン) | 名前 |");
                console.log("| --: | :-- |");

                memoryRanking.slice(0, 10).forEach((stat) => {
                    console.log(`| ${Math.round(stat.average)} | ${stat.name || "No Name"} |`);
                });
                console.log("---");
                console.log("");
            }

            // Logic for --synth option
            if (options.synth && allResults.length > 0) {
                const best = allResults[0];
                const mainMem = memories.find(m => m.filename === best.mainFilename);
                const subMem = memories.find(m => m.filename === best.subFilename);

                if (mainMem && subMem) {
                    console.error("\n--- 合成最適化シミュレーションを開始 ---");
                    console.error(`Base Main: ${mainMem.data.name || "Unknown"} (Score: ${Math.round(best.score)})`);

                    try {
                        // Check for "🛠️" (Hammer) to detect synthesized memories
                        const mainName = mainMem.data.name || "";
                        const subName = subMem.data.name || "";
                        const mainHasHammer = mainName.includes("🛠️");
                        const subHasHammer = subName.includes("🛠️");

                        let targetMain = mainMem.data;
                        let targetSub = subMem.data;
                        let swapped = false;

                        if (mainHasHammer && subHasHammer) {
                            console.log(`Skipping: Both memories are synthesized (🛠️).`);
                            console.log("");
                            // continue; // Can't use continue here inside just if block if not loop?
                            // Actually this code snippet is inside the loop in original file.
                            // But logic structure here is nested.
                            // Original code had `continue` inside loop.
                        } else {

                            if (mainHasHammer) {
                                console.log(`Main memory has 🛠️. Swapping target to Sub memory.`);
                                targetMain = subMem.data;
                                targetSub = mainMem.data;
                                swapped = true;
                            }

                            const synthResults = await recommendSynthesis(targetMain, targetSub, contestStage.id, numRuns);

                            if (synthResults.length > 0) {
                                console.log(`\n### 推奨合成結果 (TOP 10) ${swapped ? "(Swapped)" : ""}`);
                                console.log("| スコア | Slot | 変更内容 |");
                                console.log("| --: | :-- | :-- |");

                                synthResults.slice(0, 10).forEach(res => {
                                    const diff = Math.round(res.score - best.score);
                                    const diffStr = diff > 0 ? `(+${diff})` : `(${diff})`;
                                    console.log(`| ${Math.round(res.score)} ${diffStr} | ${res.meta.slot} | ${res.meta.originalName} -> ${res.meta.newName} |`);
                                });
                            } else {
                                console.log("\n有効な合成候補が見つかりませんでした。");
                            }
                        }
                    } catch (e) {
                        console.error("合成シミュレーション エラー:", e);
                    }
                    console.log("");
                }
            }
        }
    }

    // Final summary is now handled by per-idol output during the loop for streaming.
    // No additional output needed here to avoid duplication in wrappers like contest.ts.
}

async function loadMemoriesFromDB(uri, options) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || "gakumas-tools"); // Use default db from URI
        const collection = db.collection("memories");

        let query = {};
        const { idolName, plan } = options;

        if (idolName) {
            // idolName passed here is always single (due to caller loop)
            const idolId = IDOL_NAME_TO_ID[idolName.toLowerCase()];
            if (!idolId) {
                // Try searching by exact pIdolId if numeric
                if (!isNaN(parseInt(idolName))) {
                    query.pIdolId = parseInt(idolName);
                } else {
                    console.error(`エラー: アイドル名 '${idolName}' が見つかりません。`);
                    return [];
                }
            } else {
                // Get all pIdolIds for this idol
                const targetPIdols = PIdols.getAll().filter(p => p.idolId === idolId);
                const pIdolIds = targetPIdols.map(p => p.id);
                query.pIdolId = { $in: pIdolIds };
            }
        }

        if (plan) {
            const validPlans = ["sense", "logic", "anomaly"];
            if (!validPlans.includes(plan)) {
                console.error(`エラー: プラン '${plan}' が無効です。使用可能なプラン: ${validPlans.join(", ")}`);
                return [];
            }
            // Refine query based on plan
            // We need to find pIdolIds that match this plan AND the idolId (if set)
            const targetPIdols = PIdols.getAll().filter(p => p.plan === plan);
            const planPIdolIds = targetPIdols.map(p => p.id);

            if (query.pIdolId && query.pIdolId.$in) {
                // Intersection of existing ids and plan ids
                const existing = query.pIdolId.$in;
                const intersection = existing.filter(id => planPIdolIds.includes(id));
                query.pIdolId = { $in: intersection };
            } else {
                query.pIdolId = { $in: planPIdolIds };
            }
        }

        const memories = await collection.find(query).toArray();
        console.error(`MongoDBから ${memories.length} 件のメモリーを取得しました。`);

        return memories.map(m => ({
            filename: m.name || m._id.toString(), // Use DB name or ID as identifier
            data: m
        }));

    } catch (e) {
        console.error("MongoDB Error:", e);
        return [];
    } finally {
        await client.close();
    }
}

run().then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
