import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { PIdols, Idols } from "gakumas-data";

async function run() {
    const args = process.argv.slice(2);
    // Support generic invocation: node analyze-memories.mjs <uri> [idol] [plan]
    // OR: node analyze-memories.mjs [idol] [plan] (if URI is in env)

    let uri = process.env.MONGODB_URI;
    let idolFilter = null;
    let planFilter = null;

    // Filter out flags for positional processing
    const positionalArgs = args.filter(a => !a.startsWith('--'));
    const jsonMode = args.includes('--json');

    if (positionalArgs[0] && positionalArgs[0].startsWith("mongodb")) {
        uri = positionalArgs[0];
        idolFilter = positionalArgs[1];
        planFilter = positionalArgs[2];
    } else {
        // Assume args are filters
        idolFilter = positionalArgs[0];
        planFilter = positionalArgs[1];
    }

    if (!uri) {
        console.error("エラー: MongoDB URIが設定されていません。.env.localを確認するか、引数として指定してください。");
        process.exit(1);
    }

    // Name mapping for filtering
    const nameToId = {
        "saki": 1, "temari": 2, "kotone": 3, "tsubame": 13,
        "mao": 4, "lilja": 5, "china": 6,
        "sumika": 7, "hiro": 8, "sena": 11,
        "misuzu": 12, "ume": 10, "rinami": 9, "rina": 9
    };

    const dbName = process.env.MONGODB_DB;

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("memories");

        // info: pIdolId isn't indexed usually but for 1000 items it's fast enough.
        // Aggregate: Group by pIdolId and count
        const pipeline = [
            {
                $group: {
                    _id: "$pIdolId",
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        let totalCount = results.reduce((acc, curr) => acc + curr.count, 0);

        let rows = results.map(r => {
            const pIdolId = r._id;
            const pIdol = PIdols.getById(pIdolId);

            if (!pIdol) {
                return {
                    idolName: "Unknown",
                    title: `Unknown (ID:${pIdolId})`,
                    plan: "-",
                    recEffect: "-",
                    count: r.count,
                    idolId: 999
                };
            }

            const idol = Idols.getById(pIdol.idolId);
            const idolName = idol ? idol.name.replace(" ", "") : "Unknown";

            // Map plan to Japanese
            const planMap = {
                "sense": "センス",
                "logic": "ロジック",
                "anomaly": "アノマリー"
            };
            const planJa = planMap[pIdol.plan] || pIdol.plan;

            // Recommended Effect
            const recEffect = pIdol.recommendedEffect;
            const recEffectMap = {
                "goodConditionTurns": "好調",
                "concentration": "集中",
                "goodImpressionTurns": "好印象",
                "motivation": "やる気",
                "strength": "強気",
                "preservation": "温存",
                "fullPower": "全力",
                "leisure": "のんびり",
            };
            const recEffectJa = recEffectMap[recEffect] || recEffect || "-";


            return {
                idolName: idolName,
                title: pIdol.title,
                plan: planJa,
                recEffect: recEffectJa,
                count: r.count,
                idolId: pIdol.idolId, // For sorting
                // Raw for filtering
                rawPlan: pIdol.plan,
                rawIdolId: pIdol.idolId
            };
        });

        // Filter
        if (idolFilter) {
            const targetIdolId = nameToId[idolFilter.toLowerCase()];
            if (targetIdolId) {
                rows = rows.filter(r => r.rawIdolId === targetIdolId);
            } else if (idolFilter !== 'all') {
                // Try loose matching on name if needed, but for now strict map
                console.warn(`警告: アイドル名 '${idolFilter}' が見つかりません。`);
            }
        }
        if (planFilter) {
            const p = planFilter.toLowerCase();
            rows = rows.filter(r => r.rawPlan === p);
        }

        // Recalculate total after filter
        totalCount = rows.reduce((acc, r) => acc + r.count, 0);

        // Sort: Idol ID -> Plan -> RecEffect -> Title
        rows.sort((a, b) => {
            if (a.idolId !== b.idolId) return a.idolId - b.idolId;
            if (a.plan !== b.plan) return a.plan.localeCompare(b.plan);
            if (a.recEffect !== b.recEffect) return a.recEffect.localeCompare(b.recEffect);
            return a.title.localeCompare(b.title);
        });

        // Output
        if (jsonMode) {
            console.log(JSON.stringify({
                type: 'idol',
                data: {
                    idolName: idolFilter || 'All',
                    total: totalCount,
                    breakdown: rows
                }
            }));
        } else {
            console.log(`## メモリー統計 (合計: ${totalCount} 件)`);
            console.log("");
            console.log("| アイドル名 | プラン名 | おすすめ | 楽曲名 | 枚数 |");
            console.log("| :-- | :-- | :-- | :-- | --: |");

            rows.forEach(row => {
                console.log(`| ${row.idolName} | ${row.plan} | ${row.recEffect} | ${row.title} | ${row.count} |`);
            });
        }

    } catch (e) {
        console.error("エラーが発生しました:", e);
    } finally {
        await client.close();
    }
}

run();
