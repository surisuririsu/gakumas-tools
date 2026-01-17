
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { Idols, PIdols } from "gakumas-data"; // Note: format-memory uses PIdols/SkillCards etc.
import { formatMemory } from "./lib/format-memory.mjs";

async function run() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri) {
        console.error("エラー: MONGODB_URI が設定されていません。");
        process.exit(1);
    }

    const args = process.argv.slice(2);
    let query = {};
    let similarityMode = false;
    let targetPlan = null;
    let targetIdol = null;
    let threshold = 4; // Default similarity threshold (matches)

    if (args.length >= 2) {
        similarityMode = true;
        targetPlan = args[0].toLowerCase(); // e.g., "sense"
        targetIdol = args[1].toLowerCase(); // e.g., "kotone"
        if (args[2]) threshold = parseInt(args[2], 10);

        // Name to ID map (Keep in sync with dump-memories.mjs)
        const nameToId = {
            "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
            "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
        };

        const idolId = nameToId[targetIdol];
        if (!idolId) {
            console.error(`エラー: アイドル名 '${targetIdol}' が見つかりません。`);
            console.error("使用可能な名前: " + Object.keys(nameToId).join(", "));
            process.exit(1);
        }

        const validPlans = ["sense", "logic", "anomaly"];
        if (!validPlans.includes(targetPlan)) {
            console.error(`エラー: プラン '${targetPlan}' が無効です。使用可能なプラン: ${validPlans.join(", ")}`);
            process.exit(1);
        }

        const targetPIdols = PIdols.getAll().filter(p => p.idolId === idolId && p.plan === targetPlan);
        const pIdolIds = targetPIdols.map(p => p.id);

        if (pIdolIds.length === 0) {
            console.log(`条件に一致するPアイドルが見つかりませんでした (Idol: ${targetIdol}, Plan: ${targetPlan})`);
            process.exit(0);
        }

        query = { pIdolId: { $in: pIdolIds } };
        console.log(`モード: 類似検索 (Plan: ${targetPlan}, Idol: ${targetIdol}, Threshold: ${threshold} matches)`);
    } else {
        console.log("モード: 完全一致検索 (全件)");
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("memories");

        console.error("メモリー情報を取得中...");

        // Fetch all memories
        // Schema is actually flat, not nested under "data"
        const memories = await collection.find(query).project({
            _id: 1,
            pIdolId: 1,
            skillCardIds: 1,
            params: 1,
            name: 1
        }).toArray();

        console.error(`対象メモリー数: ${memories.length}`);

        if (similarityMode) {
            // SIMILARITY CHECK LOGIC: Greedy Star Clustering
            // 1. Sort all memories by Power (Stats) DESC
            // This ensures the "Reference" is always the strongest one available.
            memories.sort((a, b) => {
                const sumA = (a.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                const sumB = (b.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                return sumB - sumA;
            });

            const visited = new Set();
            const groups = [];

            for (let i = 0; i < memories.length; i++) {
                if (visited.has(i)) continue;

                // memA is the Center/Reference (Strongest available)
                const memA = memories[i];
                const cardsA = new Set(memA.skillCardIds || []);

                const group = [memA];
                visited.add(i);

                for (let j = i + 1; j < memories.length; j++) {
                    if (visited.has(j)) continue;

                    const memB = memories[j];
                    const cardsB = memB.skillCardIds || [];

                    let matchCount = 0;
                    for (const id of cardsB) {
                        if (cardsA.has(id)) matchCount++;
                    }

                    // Strict Threshold Check against the Reference
                    if (matchCount >= threshold) {
                        group.push(memB);
                        visited.add(j);
                    }
                }

                if (group.length > 1) {
                    groups.push(group);
                }
            }

            // 3. Output Report
            if (groups.length === 0) {
                console.log("\n条件を満たす類似メモリーグループは見つかりませんでした。");
            } else {
                console.log("# メモリーダイエットレポート（類似）");
                let groupIndex = 1;

                for (const group of groups) {
                    // Group is already sorted by Power (center is index 0)
                    console.log(`\n## グループ: ${groupIndex} (数: ${group.length})`);

                    const referenceMem = group[0];
                    const refCards = new Set(referenceMem.skillCardIds || []);

                    for (const mem of group) {
                        const stats = (mem.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);

                        let additionalInfo = `(Stats: ${stats}`;

                        // Calculate match with reference (if distinct)
                        if (mem._id !== referenceMem._id) {
                            const myCards = mem.skillCardIds || [];
                            let matchCount = 0;
                            for (const id of myCards) {
                                if (refCards.has(id)) matchCount++;
                            }
                            const totalSlots = Math.max(refCards.size, myCards.length);
                            additionalInfo += `, Match: ${matchCount}/${totalSlots}`;
                        } else {
                            additionalInfo += `, Reference`;
                        }
                        additionalInfo += `)`;

                        console.log(formatMemory(mem).trim() + ` ${additionalInfo}`);
                    }
                    groupIndex++;
                }
            }

        } else {
            // EXISTING EXACT MATCH LOGIC
            // Group by pIdolId
            const byPIdol = {};
            for (const mem of memories) {
                if (!byPIdol[mem.pIdolId]) byPIdol[mem.pIdolId] = [];
                byPIdol[mem.pIdolId].push(mem);
            }

            const candidates = [];

            console.log("# メモリーダイエットレポート（重複度）");

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
                            const stats = (mem.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
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
                // fs.writeFileSync("candidates.json", JSON.stringify(candidates, null, 2));
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
