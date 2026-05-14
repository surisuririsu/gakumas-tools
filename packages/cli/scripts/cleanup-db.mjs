import { MongoClient } from "mongodb";
import readline from "readline";

async function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
    });

    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
}

async function run() {
    const mongodbUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || "gakumas-tools";

    if (!mongodbUri) {
        console.error("エラー: MONGODB_URI が環境変数に設定されていません。");
        process.exit(1);
    }

    // Get current SUPPORT_BONUS from process.env (which may have been loaded from .env.local)
    let bonusFromEnv = parseFloat(process.env.SUPPORT_BONUS || "0");

    // Also check .env.local directly to ensure we get the "higher" value if both exist
    let bonusFromFile = 0;
    try {
        const fs = await import('fs');
        const path = await import('path');
        const possiblePaths = [
            path.resolve(process.cwd(), '.env.local'),
            path.resolve(process.cwd(), '../../.env.local'),
            path.resolve(process.cwd(), 'gakumas-tools/.env.local')
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                const content = fs.readFileSync(p, 'utf-8');
                const lines = content.split('\n');
                for (const line of lines) {
                    const match = line.match(/^SUPPORT_BONUS=(.*)$/);
                    if (match) {
                        bonusFromFile = parseFloat(match[1].trim().replace(/^["'](.*)["']$/, '$1'));
                        break;
                    }
                }
                break;
            }
        }
    } catch (e) {
        // Ignore errors reading file
    }

    const supportBonusRaw = Math.max(bonusFromEnv, bonusFromFile, 0.04);
    const targetBonus = supportBonusRaw >= 1.0 ? supportBonusRaw / 100 : supportBonusRaw;
    const normalizedTarget = parseFloat(targetBonus.toFixed(4));

    console.error(`基準サポートボーナス: ${(normalizedTarget * 100).toFixed(2)}% (環境変数: ${bonusFromEnv}, ファイル: ${bonusFromFile} の最大値)`);

    const client = new MongoClient(mongodbUri);
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const targets = [
            { name: "loadouts", collection: db.collection("loadouts") },
            { name: "simulation_results", collection: db.collection("simulation_results") }
        ];

        const query = { supportBonus: { $lt: normalizedTarget } };
        let totalToDelete = 0;
        const counts = {};

        for (const target of targets) {
            const count = await target.collection.countDocuments(query);
            counts[target.name] = count;
            totalToDelete += count;
        }

        if (totalToDelete === 0) {
            console.log(`サポートボーナスが ${normalizedTarget} 未満のデータは見つかりませんでした。`);
            return;
        }

        console.error("\n削除対象のデータ件数:");
        for (const target of targets) {
            console.error(`- ${target.name}: ${counts[target.name]} 件`);
        }
        console.error(`合計: ${totalToDelete} 件\n`);
        
        const answer = await askQuestion(`これらの合計 ${totalToDelete} 件のデータを削除しますか？ [y/N]: `);
        if (answer.toLowerCase() !== 'y') {
            console.log("削除をキャンセルしました。");
            return;
        }

        console.error("削除を実行中...");
        for (const target of targets) {
            if (counts[target.name] > 0) {
                const result = await target.collection.deleteMany(query);
                console.log(`正常に ${target.name} から ${result.deletedCount} 件のデータを削除しました。`);
            }
        }
        console.log("\nクリーンアップが完了しました。");

    } catch (e) {
        console.error("MongoDB エラー:", e);
        process.exit(1);
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
