
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
    console.error("エラー: MONGODB_URI が設定されていません");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("使用法: yarn node scripts/dump-memories.mjs <pIdolIds> [output_dir]");
        console.log("  <pIdolIds>: ダンプするアイドルのID (カンマ区切りで複数指定可 例: 1,2,3)");
        console.log("  [output_dir]: 出力先ディレクトリ (デフォルト: ./memories_dump)");
        process.exit(1);
    }

    let query = {};
    if (args[0] !== "all") {
        // Check if first arg is a name (not a number)
        const firstArg = args[0];
        if (isNaN(parseInt(firstArg))) {
            const idolName = firstArg.toLowerCase();
            const plan = args[1]?.toLowerCase();
            const outputDirArg = args[2];

            // Define English Name to ID map
            const nameToId = {
                "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
                "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
            };

            const idolId = nameToId[idolName];
            if (!idolId) {
                console.error(`エラー: アイドル名 '${idolName}' が見つかりません。`);
                console.error("使用可能な名前: " + Object.keys(nameToId).join(", "));
                process.exit(1);
            }

            // Import PIdols data
            const { PIdols } = await import("./lib/gakumas-data/index.js");

            // Filter PIdols by idolId and plan
            let targetPIdols = PIdols.getAll().filter(p => p.idolId === idolId);

            if (plan && plan !== "all") {
                const validPlans = ["sense", "logic", "anomaly"];
                if (!validPlans.includes(plan)) {
                    console.error(`エラー: プラン '${plan}' が無効です。使用可能なプラン: ${validPlans.join(", ")}`);
                    process.exit(1);
                }
                targetPIdols = targetPIdols.filter(p => p.plan === plan);
            }

            const pIdolIds = targetPIdols.map(p => p.id);
            if (pIdolIds.length === 0) {
                console.log(`条件に一致するPアイドルが見つかりませんでした (Idol: ${idolName}, Plan: ${plan})`);
                process.exit(0);
            }

            console.log(`抽出対象: ${idolName} (${plan || "all"}) -> pIdolIds: ${pIdolIds.join(", ")}`);
            query = { pIdolId: { $in: pIdolIds } };

            // Shift args for outputDir handling if needed, but since we use explicit variables above, 
            // we just set outputDir variable correctly.
            // The original code uses args[1] for outputDir when numeric IDs are used. 
            // Here outputDir is args[2] if name/plan are provided.
            // We need to adjust how outputDir is assigned below.

            // Hacky way to pass outputDir to the existing logic below? 
            // Better to standardize outputDir assignment.

        } else {
            const pIdolIds = args[0].split(",").map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            query = { pIdolId: { $in: pIdolIds } };
        }
    }

    // Determine outputDir based on usages
    let outputDir;
    if (args[0] === "all") {
        outputDir = args[1] || "./memories_dump";
    } else if (isNaN(parseInt(args[0]))) {
        // Name mode: dump <name> <plan> [output]
        outputDir = args[2] || "./memories_dump";
    } else {
        // ID mode: dump <ids> [output]
        outputDir = args[1] || "./memories_dump";
    }


    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");

        const memories = await collection.find(query).toArray();

        if (memories.length === 0) {
            console.log(`条件に一致するメモリーは見つかりませんでした。`);
            process.exit(0);
        }

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`${memories.length} 件のメモリーが見つかりました。保存中...`);

        memories.forEach((memory, index) => {
            // Remove MongoDB internal ID and userId for privacy/cleanliness
            const { _id, userId, ...cleanMemory } = memory;

            // Create a safe filename
            const safeName = (cleanMemory.name || "unnamed").replace(/[^a-z0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\-_]/gi, "_");
            const filename = path.join(outputDir, `${safeName}_${_id}.json`);

            fs.writeFileSync(filename, JSON.stringify(cleanMemory, null, 2));
            console.log(`保存しました: ${filename}`);
        });

        console.log("完了しました。");

    } catch (e) {
        console.error("エラーが発生しました:", e);
    } finally {
        await client.close();
    }
}

run();
