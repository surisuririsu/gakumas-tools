
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { Idols } from "gakumas-data"; // Note: format-memory uses PIdols/SkillCards etc.
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

        console.error("メモリー情報を取得中...");

        // Fetch all memories
        // Schema is actually flat, not nested under "data"
        const memories = await collection.find({}).project({
            _id: 1,
            pIdolId: 1,
            skillCardIds: 1,
            params: 1,
            name: 1
        }).toArray();

        // if (memories.length > 0) { console.log("Memory Sample:", JSON.stringify(memories[0], null, 2)); }

        console.error(`総メモリー数: ${memories.length}`);

        // Group by pIdolId
        const byPIdol = {};
        for (const mem of memories) {
            if (!byPIdol[mem.pIdolId]) byPIdol[mem.pIdolId] = [];
            byPIdol[mem.pIdolId].push(mem);
        }

        const candidates = [];

        console.log("# メモリーダイエットレポート（重複度）");

        let headerPrinted = false;
        let groupIndex = 1;
        let anyDuplicateFound = false;

        for (const [pIdolId, group] of Object.entries(byPIdol)) {
            // Group by Signature (Sorted Skill IDs)
            const bySig = {};
            for (const mem of group) {
                if (!mem.skillCardIds) continue;
                const sig = mem.skillCardIds.slice().sort((a, b) => a - b).join(",");
                if (!bySig[sig]) bySig[sig] = [];
                bySig[sig].push(mem);
            }

            for (const [sig, dupeGroup] of Object.entries(bySig)) {
                if (dupeGroup.length > 1) {
                    anyDuplicateFound = true;
                    // Sort by Total Stats (Vo+Da+Vi) DESC
                    // params is [Vo, Da, Vi, Stamina?], we sum first 3
                    dupeGroup.sort((a, b) => {
                        const sumA = (a.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                        const sumB = (b.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                        return sumB - sumA;
                    });

                    console.log(`\n## 対象: ${groupIndex}`);

                    for (const mem of dupeGroup) {
                        // Calculate Stats for display
                        const stats = (mem.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                        // Print using formatter
                        // Format:
                        // ### [Idol] [P-Idol] - (MemoryName)
                        // - Skill ...
                        console.log(formatMemory(mem).trim() + ` (Stats: ${stats})`);
                    }

                    // Add candidates (losers)
                    const keeper = dupeGroup[0];
                    const keeperPower = (keeper.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                    const losers = dupeGroup.slice(1);

                    for (const loser of losers) {
                        const loserPower = (loser.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                        candidates.push({
                            id: loser._id,
                            name: loser.name,
                            power: loserPower,
                            pIdolId: parseInt(pIdolId),
                            reason: `Duplicate of ${keeper.name} (Stats: ${keeperPower})`
                        });
                    }

                    groupIndex++;
                }
            }
        }

        if (!anyDuplicateFound) {
            console.log("\n重複メモリーは見つかりませんでした。");
        } else {
            console.log(`\n発見された冗長メモリー: ${candidates.length} 件`);
            console.log(`削除候補リストを 'candidates.json' に保存します。`);
            fs.writeFileSync("candidates.json", JSON.stringify(candidates, null, 2));
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
