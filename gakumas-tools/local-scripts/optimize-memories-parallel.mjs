import { Stages, PIdols, Idols } from "gakumas-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import os from 'os';
import { MongoClient } from "mongodb";

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
        console.error("使用法: yarn node local-scripts/optimize-memories-parallel.mjs <source> <season-stage> <num_runs> [options]");
        console.error("  <source>: ディレクトリパス または MongoDB URI (mongodb://...)");
        console.error("  <options>: --idolName <name>, --plan <sense|logic|anomaly> (DBモード時のみ有効), --showWorst (低スコアワースト10を表示)");
        process.exit(1);
    }

    const source = args[0];
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

    // Auto-detect plan from stage definition if not provided
    if (!options.plan && contestStage.plan && contestStage.plan !== 'free') {
        options.plan = contestStage.plan;
        console.error(`ステージ情報からプランを自動設定しました: ${options.plan}`);
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

        if (memories.length === 0) {
            console.error("対象のメモリーが見つかりませんでした。スキップします。");
            continue;
        }

        // Generate All Combinations
        console.error("組み合わせ生成中...");
        const combinations = [];
        for (const mainMem of memories) {
            for (const subMem of memories) {
                // For DB sourced items, filename might be the ID string, ensure uniqueness check works
                if (mainMem.filename === subMem.filename) continue;
                combinations.push({ main: mainMem, sub: subMem });
            }
        }
        const totalCombs = combinations.length;
        console.error(`総組み合わせ数: ${totalCombs} 通り`);

        if (totalCombs === 0) {
            console.error("組み合わせが生成できませんでした。スキップします。");
            continue;
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
            await Promise.all(promises);
        } catch (err) {
            console.error("\nWorker Error:", err);
            // Continue to next idol
            continue;
        } finally {
            for (const worker of workers) {
                worker.terminate();
            }
        }

        const duration = (Date.now() - startTime) / 1000;
        console.error(`\n- 完了! 処理時間: ${duration.toFixed(1)}秒`);
        console.error("---");
        // End of Progress Output (stderr)

        // Start of Report Output (stdout)
        allResults.sort((a, b) => b.score - a.score);

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
        } else {
            // Just empty line and separator if not showing worst
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
