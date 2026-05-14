
import { Stages } from "gakumas-data";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// Manually load .env.local
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach(line => {
        const [key, ...values] = line.split("=");
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join("=").trim();
        }
    });
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("使用法: ./local-run clear-cache <season-stage>");
        process.exit(1);
    }

    const [seasonStr, stageStr] = args[0].split("-");
    const season = parseInt(seasonStr, 10);
    const stageNumber = parseInt(stageStr, 10);

    if (isNaN(season) || isNaN(stageNumber)) {
        console.error("エラー: シーズン/ステージの指定が不正です (例: 38-1)");
        process.exit(1);
    }

    // Resolve Stage ID
    const stages = Stages.getAll();
    const targetStage = stages.find((s) => s.type == "contest" && s.season == season && s.stage == stageNumber);

    if (!targetStage) {
        console.error(`ステージが見つかりません: シーズン${season} ステージ${stageNumber}`);
        process.exit(1);
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("エラー: MONGODB_URI が設定されていません。");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || "gakumas-tools");
        const collection = db.collection("simulation_results");

        const query = {
            season: season,
            stageId: targetStage.id
        };

        console.log(`削除対象: シーズン${season} ステージ${stageNumber} (ID: ${targetStage.id})`);

        const result = await collection.deleteMany(query);

        console.log(`削除完了: ${result.deletedCount} 件のキャッシュを削除しました。`);

    } catch (e) {
        console.error("エラー:", e);
    } finally {
        await client.close();
    }
}

run();
