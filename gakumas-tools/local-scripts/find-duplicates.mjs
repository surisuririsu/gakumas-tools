
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
    let similarityMode = false;
    let targetPlan = "all";
    let targetIdol = "all";
    let threshold = 4;

    const nameToId = {
        "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
        "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
    };

    if (args.length >= 2) {
        similarityMode = true;
        targetPlan = args[0].toLowerCase();
        targetIdol = args[1].toLowerCase();
        if (args[2]) threshold = parseInt(args[2], 10);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("memories");

        // Helper to process a specific scope
        async function processScope(plan, idolName, currentThreshold) {
            const idolId = nameToId[idolName];
            if (!idolId) return 0;

            // Filter PIdols
            const targetPIdols = PIdols.getAll().filter(p => p.idolId === idolId && p.plan === plan);
            const pIdolIds = targetPIdols.map(p => p.id);
            if (pIdolIds.length === 0) return 0;

            const memories = await collection.find({ pIdolId: { $in: pIdolIds } }).project({
                _id: 1, pIdolId: 1, skillCardIds: 1, params: 1, name: 1
            }).toArray();

            if (memories.length < 2) return 0;

            // Sort by Power DESC
            memories.sort((a, b) => {
                const sumA = (a.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                const sumB = (b.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                return sumB - sumA;
            });

            const visited = new Set();
            const groups = [];

            for (let i = 0; i < memories.length; i++) {
                if (visited.has(i)) continue;

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

                    if (matchCount >= currentThreshold) {
                        group.push(memB);
                        visited.add(j);
                    }
                }

                if (group.length > 1) {
                    groups.push(group);
                }
            }

            if (groups.length > 0) {
                console.log(`\n### ${idolName} (${plan}) - Found ${groups.length} groups`);
                let groupIndex = 1;
                for (const group of groups) {
                    console.log(`\n## グループ: ${groupIndex} (数: ${group.length})`);
                    const referenceMem = group[0];
                    const refCards = new Set(referenceMem.skillCardIds || []);

                    for (const mem of group) {
                        const stats = (mem.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                        let additionalInfo = `(Stats: ${stats}`;
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
                return groups.length;
            }
            return 0;
        }

        if (similarityMode) {
            const plans = targetPlan === "all" ? ["sense", "logic", "anomaly"] : [targetPlan];

            // For 'all' idols, identify unique IDs to avoid duplicates (e.g. rina/rinami)
            let idolIdsToScan = [];
            if (targetIdol === "all") {
                idolIdsToScan = [...new Set(Object.values(nameToId))];
            } else {
                idolIdsToScan = [nameToId[targetIdol]];
            }

            console.log(`# メモリーダイエットレポート（類似）`);
            console.log(`Target: Plan=${targetPlan}, Idol=${targetIdol}, Threshold=${threshold}`);

            let totalGroups = 0;
            for (const p of plans) {
                for (const id of idolIdsToScan) {
                    // Find name for ID (just for log)
                    const name = Object.keys(nameToId).find(k => nameToId[k] === id);
                    totalGroups += await processScope(p, name, threshold); // processScope uses name->id, but we can refactor processScope to take ID
                }
            }

            if (totalGroups === 0) {
                console.log("\n条件を満たす類似メモリーグループは見つかりませんでした。");
            } else {
                console.log(`\n Total Groups Found: ${totalGroups}`);
            }

        } else {
            // EXACT MATCH LOGIC (Global)
            console.log("# メモリーダイエットレポート（重複度 - 完全一致）");
            // ... (Keep existing exact match logic here if needed, or simple redirect to similarity with threshold 6?)
            // Actually exact match is basically similarity with threshold 6.
            // But existing logic handles "Exact Skill Match" regardless of order which is safer.
            // Also existing logic grouped by Signature. 
            // My similarity logic is pairwise greedy. 
            // If I use similarity with threshold 6, it should be equivalent for distinct sets, but "signature" grouping is O(N) vs O(N^2).
            // Since exact match is global, O(N^2) checks on ALL memories is bad.
            // So I should keep the hash-based exact match logic for strict duplicate finding.

            // ... Reuse the hash based logic?
            // To keep the file clean, I'll copy the previous Hash-based Logic here.

            const memories = await collection.find({}).project({
                _id: 1, pIdolId: 1, skillCardIds: 1, params: 1, name: 1
            }).toArray();
            console.error(`総メモリー数: ${memories.length}`);

            const byPIdol = {};
            for (const mem of memories) {
                if (!byPIdol[mem.pIdolId]) byPIdol[mem.pIdolId] = [];
                byPIdol[mem.pIdolId].push(mem);
            }

            const candidates = [];
            let groupIndex = 1;

            for (const [pIdolId, group] of Object.entries(byPIdol)) {
                const bySig = {};
                for (const mem of group) {
                    if (!mem.skillCardIds) continue;
                    const sig = mem.skillCardIds.slice().sort((a, b) => a - b).join(",");
                    if (!bySig[sig]) bySig[sig] = [];
                    bySig[sig].push(mem);
                }

                for (const [sig, dupeGroup] of Object.entries(bySig)) {
                    if (dupeGroup.length > 1) {
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

                        const keeper = dupeGroup[0];
                        const keeperPower = (keeper.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                        const losers = dupeGroup.slice(1);
                        for (const loser of losers) {
                            const loserPower = (loser.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
                            candidates.push({
                                id: loser._id, name: loser.name, power: loserPower, pIdolId: parseInt(pIdolId),
                                reason: `Duplicate of ${keeper.name} (Stats: ${keeperPower})`
                            });
                        }
                        groupIndex++;
                    }
                }
            }
            if (candidates.length === 0) {
                console.log("\n重複メモリーは見つかりませんでした。");
            } else {
                console.log(`\n発見された冗長メモリー: ${candidates.length} 件`);
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
