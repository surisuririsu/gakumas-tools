
import { MongoClient, ObjectId } from "mongodb";
import { PIdols, Idols, SkillCards } from "gakumas-data";
import readline from "readline";

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not set");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const PLAN_NAME = {
    "sense": "センス",
    "logic": "ロジック",
    "anomaly": "アノマリー"
};

async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: rm-memories.mjs <pattern>");
        process.exit(1);
    }

    const patternStr = args[0];
    const pattern = new RegExp(patternStr.replace(/\*/g, '.*'));

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");

        const query = { name: { $regex: pattern } };
        const memories = await collection.find(query).toArray();

        if (memories.length === 0) {
            console.log("No memories matched the pattern.");
            process.exit(0);
        }

        console.log(`Found ${memories.length} memories matching "${patternStr}".\n`);

        let deletedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < memories.length; i++) {
            const mem = memories[i];
            const pIdol = PIdols.getById(mem.pIdolId);
            const idol = pIdol ? Idols.getById(pIdol.idolId) : null;
            const idolName = idol ? idol.name.replace(/\s+/g, ' ') : "Unknown";
            const planName = pIdol ? (PLAN_NAME[pIdol.plan] || pIdol.plan) : "Unknown";

            console.log("---------------------------------------------------");
            console.log(`[メモリー削除確認] (${i + 1}/${memories.length} 件目)`);
            console.log("---------------------------------------------------");
            console.log(`メモリー名: ${mem.name || "名称未設定"}`);
            console.log(`アイドル:   ${idolName} (${planName})`);
            console.log(`楽曲:       ${pIdol ? pIdol.title : "Unknown"}`);

            if (mem.params) {
                const [vo, da, vi, me] = mem.params;
                console.log(`ステータス:`);
                console.log(`  Vocal: ${vo || 0} | Dance: ${da || 0} | Visual: ${vi || 0} | Stamina: ${me || 0}`);
            }

            if (mem.skillCardIds) {
                console.log(`スキルカード:`);
                mem.skillCardIds.filter(id => !!id).forEach(id => {
                    const card = SkillCards.getById(id);
                    console.log(`  - ${card ? card.name : `Unknown (${id})`}`);
                });
            }

            const answer = await question(`\nこのメモリーを削除しますか？ [y/N] (default: n) > `);
            if (answer.toLowerCase() === 'y') {
                await collection.deleteOne({ _id: mem._id });
                console.log("-> 削除しました。");
                deletedCount++;
            } else {
                console.log("-> スキップしました。");
                skippedCount++;
            }
            console.log("");
        }

        console.log("---------------------------------------------------");
        console.log(`最終結果: 削除 ${deletedCount} 件, スキップ ${skippedCount} 件`);
        console.log("---------------------------------------------------");

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    } finally {
        await client.close();
        rl.close();
    }
}

// Pipe safety
[process.stdout, process.stderr].forEach(stream => {
    stream.on('error', (err) => {
        if (err.code === 'EPIPE') process.exit(0);
    });
});

run();
