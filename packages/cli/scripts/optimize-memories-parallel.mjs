import { Stages, PIdols, Idols } from "gakumas-data";
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

    if (args.length < 3) {
        console.error("使用法: yarn node optimize-memories-parallel.mjs <source> <season-stage> <num_runs> [options]");
        console.error("  <source>: ディレクトリパス または MongoDB URI (mongodb://...)");
        console.error("  <options>: --idolName <name>, --plan <sense|logic|anomaly> (DBモード時のみ有効), --showWorst (低スコアワースト10を表示), --force (キャッシュを無視して再計算)");
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

    for (const currentIdolName of idolNames) {
        if (currentIdolName) console.error(`\n========== アイドル: ${currentIdolName} の処理開始 ==========\n`);

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
        const existingResultsSet = new Set();
        const useCache = !!process.env.MONGODB_URI;

        if (useCache) {
            try {
                mongoClient = new MongoClient(process.env.MONGODB_URI);
                await mongoClient.connect();
                const db = mongoClient.db(process.env.MONGODB_DB || "gakumas-tools");
                simulationResultsCollection = db.collection("simulation_results");

                if (options.force) {
                    const deleteQuery = {
                        stageId: contestStage.id,
                        runs: numRuns,
                        season: season
                    };
                    console.error(`--force 指定: キャッシュを削除します... (Stage ID: ${contestStage.id}, Runs: ${numRuns}, Season: ${season})`);
                    const delRes = await simulationResultsCollection.deleteMany(deleteQuery);
                    console.error(`削除完了: ${delRes.deletedCount} 件のキャッシュを削除しました。`);
                } else {
                    // Pre-fetch existing results for this stage/runs to filter
                    // Optimization: Maybe only fetch hashes?
                    const query = {
                        stageId: contestStage.id,
                        runs: numRuns,
                        season: season
                    };
                    // If we could restrict by idol, that would be better, but we are cross-combining?
                    // Actually combinations are strictly within `memories` list which is filtered by Idol.
                    // So all combinations involve this idol (as Main).
                    // Wait, combinations are `memories` x `memories`.
                    // And `memories` contains only `currentIdolName`'s memories (if options.idolName is set).
                    // Yes.

                    const cached = await simulationResultsCollection.find(query).project({ mainHash: 1, subHash: 1 }).toArray();
                    cached.forEach(c => existingResultsSet.add(`${c.mainHash}_${c.subHash}`));

                    console.error(`キャッシュ済み結果: ${cached.length} 件`);
                }

            } catch (e) {
                console.error("Cache DB Connection Error:", e);
            }
        }

        // Generate All Combinations
        console.error("組み合わせ生成中...");
        const combinations = [];
        let skippedCount = 0;

        const comparePattern = options.compare ? new RegExp(options.compare.replace(/\*/g, '.*')) : null;

        for (const mainMem of memories) {
            for (const subMem of memories) {
                // For DB sourced items, filename might be the ID string, ensure uniqueness check works
                if (mainMem.filename === subMem.filename) continue;

                // If compare mode is active, at least one memory must match the pattern
                if (comparePattern) {
                    const mainMatch = mainMem.data.name && comparePattern.test(mainMem.data.name);
                    const subMatch = subMem.data.name && comparePattern.test(subMem.data.name);
                    if (!mainMatch && !subMatch) continue;
                }

                // Check Cache
                if (!options.force && existingResultsSet.has(`${mainMem.hash}_${subMem.hash}`)) {
                    skippedCount++;
                    continue;
                }

                combinations.push({ main: mainMem, sub: subMem });
            }
        }
        const totalCombs = combinations.length;
        console.error(`総組み合わせ数: ${totalCombs} 通り (キャッシュ済み: ${skippedCount} 件スキップ)`);

        if (totalCombs === 0) {
            console.error("新規計算対象の組み合わせがありません。");
            // Still need to show results?
            // If we skipped everything, we should probably fetch the results from DB to show "Best".
            // For now, let's proceed to "Show Results" phase by fetching from DB if needed.
            // But strict requirement: "Run simulations only for new combinations" -> Done.
            // "Merge cached and newly computed results for the final output" -> Need to handle below.
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
        console.error(`- 総組み合わせ数: ${totalCombs} 通り`);
        console.error(`- 並列実行数: ${workerCount} スレッド`);
        console.error(`- ステージ: シーズン${season} ステージ${stageNumber}`);
        console.error(`- 試行回数: ${numRuns} 回/組`);
        console.error("- シミュレーション開始... (時間がかかります)");

        // Split work
        const chunkSize = Math.ceil(totalCombs / workerCount);
        const chunks = [];
        for (let i = 0; i < totalCombs; i += chunkSize) {
            chunks.push(combinations.slice(i, i + chunkSize));
        }

        // Run Workers
        let completedCount = 0;
        const allResults = [];
        const workers = [];

        const startTime = Date.now();

        const promises = chunks.map((chunk, index) => {
            return new Promise((resolve, reject) => {
                // Use worker-boot.mjs to ensure loader is registered in worker thread
                const worker = new Worker(path.join(__dirname, 'worker-boot.mjs'), {
                    workerData: {
                        contestStage,
                        numRuns
                    },
                    // We don't need to inject execArgv anymore as boot script handles registration
                });

                worker.on('message', (msg) => {
                    if (msg.type === 'progress') {
                        completedCount += msg.count;
                        if (completedCount % 10 === 0 || completedCount === totalCombs) {
                            process.stderr.write(`\r- 進捗: ${completedCount}/${totalCombs} (${Math.round(completedCount / totalCombs * 100)}%)`);
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

                // Start processing
                worker.postMessage({ id: index, combinations: chunk });
                workers.push(worker);
            });
        });

        try {
            if (totalCombs > 0) {
                await Promise.all(promises);
            }
        } catch (err) {
            console.error("\nWorker Error:", err);
            // Continue to next idol
            if (mongoClient) await mongoClient.close();
            continue;
        } finally {
            for (const worker of workers) {
                worker.terminate();
            }
        }

        // Save Results to DB
        if (useCache && simulationResultsCollection && allResults.length > 0) {
            console.error(`新規結果 ${allResults.length} 件をDBに保存中...`);
            const bulkOps = allResults.map(res => ({
                updateOne: {
                    filter: {
                        mainHash: res.mainHash,
                        subHash: res.subHash,
                        stageId: contestStage.id,
                        runs: numRuns,
                        season: season
                    },
                    update: {
                        $set: {
                            mainHash: res.mainHash,
                            subHash: res.subHash,
                            stageId: contestStage.id,
                            runs: numRuns,
                            season: season,
                            score: res.score,
                            min: res.min,
                            max: res.max,
                            median: res.median,
                            mainName: res.mainName,
                            subName: res.subName,
                            mainFilename: res.mainFilename,
                            subFilename: res.subFilename,
                            createdAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            try {
                if (bulkOps.length > 0) {
                    await simulationResultsCollection.bulkWrite(bulkOps);
                }
            } catch (e) {
                console.error("DB Save Error:", e);
            }
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
                runs: numRuns,
                season: season,
                mainHash: { $in: memHashes },
                subHash: { $in: memHashes }
            };

            // If totalCombs was 0, allResults is empty.
            // If totalCombs > 0, allResults has NEW results. 
            // We want (New + Cached).

            try {
                const cachedResults = await simulationResultsCollection.find(finalQuery).toArray();

                // Merge strategies:
                // `allResults` currently contains valid result objects.
                // `cachedResults` are from DB. Map them to same structure.

                const cachedMapped = cachedResults.map(r => ({
                    mainFilename: r.mainFilename,
                    mainName: r.mainName,
                    subFilename: r.subFilename,
                    subName: r.subName,
                    score: r.score,
                    min: r.min,
                    max: r.max,
                    median: r.median,
                    mainHash: r.mainHash,
                    subHash: r.subHash
                }));

                // Deduplicate?
                // `allResults` are definitely new and unique.
                // `cachedResults` might include everything if we queried broad?
                // Actually `allResults` are NOT in DB yet when we query? 
                // Wait, I saved them just above.
                // So `cachedResults` SHOULD contain `allResults` too now.

                // So replacing `allResults` with `cachedResults` is the correct approach.
                // But `cachedResults` might miss "meta" or other runtime fields?
                // `meta` is used for synthesized name display?
                // The worker returns `meta`. `simulation_results` schema doesn't seem to store `meta`.
                // `meta` is passed from `main.meta`.

                // Re-attaching meta:
                // We can recover meta from `memories` by matching filename/hash.

                // Let's use `cachedMapped` as the source of truth for scores.
                allResults.length = 0; // Clear
                allResults.push(...cachedMapped);

                // Rehydrate meta and names for all results
                for (const res of allResults) {
                    const mainMem = memories.find(m => m.hash === res.mainHash);
                    const subMem = memories.find(m => m.hash === res.subHash);

                    if (mainMem) {
                        res.mainName = mainMem.data.name;
                        res.mainFilename = mainMem.filename;
                        res.meta = mainMem.data.meta || {};
                    }
                    if (subMem) {
                        res.subName = subMem.data.name;
                        res.subFilename = subMem.filename;
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
                    subName: best.subName
                },
                topCombinations: allResults.slice(0, 5).map(res => ({
                    mainName: res.mainName,
                    subName: res.subName,
                    min: res.min,
                    score: res.score,
                    median: res.median,
                    max: res.max
                })),
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

            // Print JSON to original console
            originalConsoleLog(JSON.stringify(finalOutputData, null, 2));

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
            console.log("| メイン | サブ | 最小値 | 平均値 | 中央値 | 最大値 |");
            console.log("| :-- | :-- | --: | --: | --: | --: |");

            // Top 5 Combinations
            allResults.slice(0, 5).forEach((res) => {
                const mainNameStr = res.mainName || "No Name";
                const subNameStr = res.subName || "No Name";

                console.log(`| ${mainNameStr} | ${subNameStr} | ${Math.round(res.min)} | ${Math.round(res.score)} | ${Math.round(res.median)} | ${Math.round(res.max)} |`);
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
            filename: m._id.toString(), // Use DB ID as unique filename/identifier
            data: m
        }));

    } catch (e) {
        console.error("MongoDB Error:", e);
        return [];
    } finally {
        await client.close();
    }
}

run();
