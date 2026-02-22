
import { MongoClient } from "mongodb";
import { PItems, SkillCards, Idols, PIdols } from "gakumas-data";

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not set");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

function calculateMatchCount(targetIds, candidateIds) {
    let count = 0;
    const tempCandidateIds = [...candidateIds];
    targetIds.forEach(id => {
        const index = tempCandidateIds.indexOf(id);
        if (index !== -1) {
            count++;
            tempCandidateIds.splice(index, 1); // 一度マッチしたものは除外（重複対応）
        }
    });
    return count;
}

async function run() {
    const args = process.argv.slice(2);
    let deckName = "";
    let listLoadouts = false;
    let threshold = 0;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--deck" && args[i + 1]) {
            deckName = args[i + 1];
        }
        if (args[i] === "--list-loadouts") {
            listLoadouts = true;
        }
        if (args[i] === "--match" && args[i + 1]) {
            threshold = parseFloat(args[i + 1]);
        }
    }

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);

        if (listLoadouts) {
            const loadouts = await db.collection("loadouts").find({}, { projection: 1 }).limit(20).toArray();
            loadouts.forEach(l => console.log(l.name));
            return;
        }

        if (!deckName) {
            console.error("Error: --deck <name> is required (or --list-loadouts)");
            process.exit(1);
        }

        // 1. Find the target deck
        const targetDeck = await db.collection("loadouts").findOne({ name: deckName });
        if (!targetDeck) {
            console.error(`Error: Deck "${deckName}" not found`);
            process.exit(1);
        }

        // 2. Extract Goals
        const goalPItems = (targetDeck.pItemIds || []).filter(id => id > 0);

        const goalCommonSkillIds = [];
        if (targetDeck.skillCardIdGroups) {
            targetDeck.skillCardIdGroups.forEach(group => {
                group.slice(1).forEach(id => {
                    if (id > 0) goalCommonSkillIds.push(id);
                });
            });
        }

        const goalUniqueSkillIds = [];
        if (targetDeck.skillCardIdGroups) {
            targetDeck.skillCardIdGroups.forEach(group => {
                if (group[0] > 0) goalUniqueSkillIds.push(group[0]);
            });
        }

        // Identify target idol(s)
        const targetIdolIds = new Set();
        goalUniqueSkillIds.forEach(id => {
            const card = SkillCards.getById(id);
            if (card && card.pIdolId) {
                const pIdol = PIdols.getById(card.pIdolId);
                if (pIdol) targetIdolIds.add(pIdol.idolId);
            }
        });

        console.log(`# 対象: ${deckName}`);
        if (targetIdolIds.size > 0) {
            const names = Array.from(targetIdolIds).map(id => Idols.getById(id)?.name || id);
            console.log(`## アイドル: ${names.join(", ")}`);
        }

        console.log(`## 目標:`);
        console.log(`### Pアイテム (${goalPItems.length})`);
        goalPItems.forEach(id => {
            const item = PItems.getById(id);
            console.log(`- ${item ? item.name : `Unknown (${id})`}`);
        });

        console.log(`\n### メモリー共通スキル (${goalCommonSkillIds.length})`);
        goalCommonSkillIds.forEach(id => {
            const card = SkillCards.getById(id);
            console.log(`- ${card ? card.name : `Unknown (${id})`}`);
        });

        // 3. Find Candidates (Total Search Pairs)
        let ownedMemories = await db.collection("memories").find({}).toArray();

        // Filter by idol
        if (targetIdolIds.size > 0) {
            ownedMemories = ownedMemories.filter(mem => {
                const pIdol = PIdols.getById(mem.pIdolId);
                return pIdol && targetIdolIds.has(pIdol.idolId);
            });
        }

        if (ownedMemories.length === 0) {
            console.log("Error: No memories found for the specified idol.");
            return;
        }

        console.log(`\nメモリー数: ${ownedMemories.length} -> 組み合わせ数: ${ownedMemories.length * (ownedMemories.length + 1) / 2} を探索中...`);

        if (threshold > 0) {
            console.log(`しきい値: ${threshold.toFixed(2)} 以上の候補を表示します。`);
        }

        const candidates = [];

        for (let i = 0; i < ownedMemories.length; i++) {
            for (let j = i; j < ownedMemories.length; j++) {
                const m1 = ownedMemories[i];
                const m2 = ownedMemories[j];

                // Pアイテム統合 (Setでユニークに)
                const combinedPItems = Array.from(new Set([
                    ...(m1.pItemIds || []),
                    ...(m2.pItemIds || [])
                ])).filter(id => id > 0);

                // スキル統合 (リスト。重複を許容して目標と比較)
                const combinedCommonSkills = [
                    ...(m1.skillCardIds || []).slice(1),
                    ...(m2.skillCardIds || []).slice(1)
                ].filter(id => id > 0);

                const matchedPItemCount = calculateMatchCount(goalPItems, combinedPItems);
                const matchedSkillCount = calculateMatchCount(goalCommonSkillIds, combinedCommonSkills);

                // スコア計算 (重み付き: Pアイテム 100%, 共通スキル 200%)
                // (matchedItems / 4) * (1/3) + (matchedSkills / 10) * (2/3)
                const score = ((matchedPItemCount / 4.0) + 2.0 * (matchedSkillCount / 10.0)) / 3.0;

                if (score >= threshold) {
                    candidates.push({
                        m1,
                        m2,
                        score,
                        matchedPItemCount,
                        matchedSkillCount,
                        combinedPItems,
                        combinedCommonSkills
                    });
                }
            }
        }

        candidates.sort((a, b) => b.score - a.score);

        console.log(`\n## 候補ペア:`);

        candidates.slice(0, 5).forEach((cand, idx) => {
            console.log(`\n### 候補 ${idx + 1} スコア: ${cand.score.toFixed(2)}`);
            console.log(`- メイン: ${cand.m1.name}`);
            console.log(`- サブ  : ${cand.m2.name}`);

            console.log(`\n#### Pアイテム (${cand.matchedPItemCount}/4)`);
            const matchedPIds = goalPItems.filter(id => cand.combinedPItems.includes(id));
            const missingPIds = goalPItems.filter(id => !cand.combinedPItems.includes(id));
            const extraPIds = cand.combinedPItems.filter(id => !goalPItems.includes(id));

            matchedPIds.forEach(id => console.log(`- [一致] ${PItems.getById(id)?.name || id}`));
            missingPIds.forEach(id => console.log(`- [不足] ${PItems.getById(id)?.name || id}`));
            extraPIds.forEach(id => console.log(`- [余剰] ${PItems.getById(id)?.name || id}`));

            console.log(`\n#### 共通スキル (${cand.matchedSkillCount}/10)`);
            // 一致スキルの詳細表示（重複対応）
            const matchedSkillDetails = [];
            const tempCombinedSkills = [...cand.combinedCommonSkills];
            goalCommonSkillIds.forEach(id => {
                const index = tempCombinedSkills.indexOf(id);
                if (index !== -1) {
                    matchedSkillDetails.push({ id, status: '[一致]' });
                    tempCombinedSkills.splice(index, 1);
                } else {
                    matchedSkillDetails.push({ id, status: '[不足]' });
                }
            });

            matchedSkillDetails.forEach(s => console.log(`- ${s.status} ${SkillCards.getById(s.id)?.name || s.id}`));
            tempCombinedSkills.forEach(id => console.log(`- [余剰] ${SkillCards.getById(id)?.name || id}`));
        });

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
