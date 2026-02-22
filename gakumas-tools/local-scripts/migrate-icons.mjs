
import { MongoClient } from "mongodb";

async function run() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri) {
        console.error("エラー: MONGODB_URI が設定されていません。");
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const isCommit = args.includes("--commit");

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("memories");

        // Find memories with lock icon
        const cursor = collection.find({ name: /🔒/ });
        const memories = await cursor.toArray();

        console.log(`🔒 を含むメモリー数: ${memories.length}`);

        if (memories.length === 0) {
            console.log("置換対象はありません。");
            return;
        }

        const updates = [];

        console.log("--- 置換プレビュー ---");
        for (const mem of memories) {
            const oldName = mem.name;
            const newName = oldName.replace(/🔒/g, "🛠️"); // Replace Lock with HammerAndWrench

            // Log sample (first 10 or so)
            if (updates.length < 10) {
                console.log(`"${oldName}" -> "${newName}"`);
            }

            updates.push({
                updateOne: {
                    filter: { _id: mem._id },
                    update: { $set: { name: newName } }
                }
            });
        }

        if (updates.length > 10) {
            console.log(`... 他 ${updates.length - 10} 件`);
        }

        if (isCommit) {
            console.log("\n実行中 (書き込み)...");
            const result = await collection.bulkWrite(updates);
            console.log(`完了しました。変更数: ${result.modifiedCount}`);
        } else {
            console.log("\n[DRY RUN] 変更は適用されていません。");
            console.log("実行するには '--commit' オプションを付けて実行してください。");
            console.log("例: yarn node ./local-scripts/migrate-icons.mjs --commit");
        }

    } catch (e) {
        console.error("エラー:", e);
    } finally {
        await client.close();
    }
}

run();
