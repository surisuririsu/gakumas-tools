
import { MongoClient } from "mongodb";
import { formatMemory } from "./lib/format-memory.mjs";

async function run() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri) {
        console.error("エラー: MONGODB_URI が設定されていません。");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("memories");

        // Fetch all memories
        // We need all fields for formatMemory
        const memories = await collection.find({}).project({
            _id: 1, pIdolId: 1, skillCardIds: 1, pItemIds: 1, params: 1, name: 1
        }).toArray();

        console.log(`総メモリー数: ${memories.length}`);

        // Regex: 
        // Start ^
        // YY/MM/DD : \d{2}\/\d{2}\/\d{2}
        // Separator: Space (half/full) or Lock (🔒) : [ 　🔒]
        // Score: digits : \d+
        // End $
        const validNameRegex = /^\d{2}\/\d{2}\/\d{2}[ 　🔒]\d+$/;

        const invalidMemories = memories.filter(m => {
            if (!m.name) return true; // Null/Empty name is invalid
            return !validNameRegex.test(m.name);
        });

        if (invalidMemories.length === 0) {
            console.log("命名規則違反のメモリーは見つかりませんでした。");
        } else {
            console.log(`# 命名規則違反メモリーレポート (${invalidMemories.length} 件)`);
            console.log("期待される形式: YY/MM/DD[スペース/🔒]スコア (例: 25/01/01 10000, 25/01/01🔒10000)");

            for (const mem of invalidMemories) {
                console.log("");
                // Highlight the name
                console.log(`!! INVALID NAME: "${mem.name}"`);
                console.log(formatMemory(mem).trim());
            }
        }

    } catch (e) {
        console.error("エラー:", e);
    } finally {
        await client.close();
    }
}

// Prevent crash on pipe/stream errors
[process.stdout, process.stderr].forEach(stream => {
    stream.on('error', (err) => {
        if (err.code === 'EPIPE' || err.code === 'ETIMEDOUT') return;
    });
});

run();
