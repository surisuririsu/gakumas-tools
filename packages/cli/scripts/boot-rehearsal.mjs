import { MongoClient } from "mongodb";
import { Stages, PIdols, SkillCards, Idols, PItems, Customizations } from "gakumas-data";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.argv[2];
const runsArg = parseInt(process.argv[3], 10) || 100;
const deckNames = process.argv.slice(4).filter(n => n && !n.startsWith('--'));

if (!MONGODB_URI) {
    console.error("MongoDB URI is missing.");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let loadouts = [];
let targetStageId = null;

async function run() {
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || "gakumas-tools");

        for (const name of deckNames) {
            const loadout = await db.collection("loadouts").findOne({ name });
            if (!loadout) {
                console.error(`Deck "${name}" not found.`);
                process.exit(1);
            }

            // Check missing datamined items (PItems and SkillCards) to prompt user to pull latest source
            for (const pItemId of (loadout.pItemIds || [])) {
                if (pItemId > 0 && !PItems.getById(pItemId)) {
                    console.error(`\n[エラー] デッキ「${name}」内に未知のPアイテムID(${pItemId})が含まれています。GitHubの最新データをPull（更新）してください。`);
                    process.exit(1);
                }
            }
            if (loadout.skillCardIdGroups) {
                for (const group of loadout.skillCardIdGroups) {
                    for (const cardId of (group || [])) {
                        if (cardId > 0 && !SkillCards.getById(cardId)) {
                            console.error(`\n[エラー] デッキ「${name}」内に未知のスキルカードID(${cardId})が含まれています。GitHubの最新データをPull（更新）してください。`);
                            process.exit(1);
                        }
                    }
                }
            }

            // Verify Stage Match
            if (loadout.stageId) {
                if (targetStageId === null) {
                    targetStageId = loadout.stageId;
                } else if (targetStageId !== loadout.stageId) {
                    console.error(`\n[エラー] 指定されたデッキ間でステージ(シーズン)情報が一致しませんでした。同一シーズンのデッキ群を指定してください。`);
                    process.exit(1);
                }
            }

            // Resolve Idol Name
            let idolName = "不明";
            if (loadout.skillCardIdGroups) {
                for (const group of loadout.skillCardIdGroups) {
                    if (group && group[0] > 0) {
                        const card = SkillCards.getById(group[0]);
                        if (card && card.pIdolId) {
                            const pIdol = PIdols.getById(card.pIdolId);
                            if (pIdol) {
                                const idol = Idols.getById(pIdol.idolId);
                                if (idol) {
                                    idolName = idol.name;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            const pItemsList = (loadout.pItemIds || []).filter(id => id > 0).map(id => {
                const item = PItems.getById(id);
                return item ? item.name : `Unknown(${id})`;
            });
            const getCardGroup = (index) => {
                const cardIds = loadout.skillCardIdGroups?.[index] || [];
                const custs = loadout.customizationGroups?.[index] || [];
                return cardIds.filter(id => id > 0).map((id, i) => {
                    const card = SkillCards.getById(id);
                    const name = card ? card.name : `Unknown(${id})`;
                    const customObj = custs?.[i];
                    if (customObj && Object.keys(customObj).length > 0) {
                        const customNames = Object.keys(customObj).map(cId => {
                            const custom = Customizations.getById(cId);
                            return custom ? custom.name : `C(${cId})`;
                        }).join(", ");
                        return `${name} (${customNames})`;
                    }
                    return name;
                });
            };

            let mainTitle = "Unknown";
            let subTitle = "Unknown";
            if (loadout.skillCardIdGroups) {
                if (loadout.skillCardIdGroups[0]?.[0] > 0) {
                    const card = SkillCards.getById(loadout.skillCardIdGroups[0][0]);
                    if (card && card.pIdolId) {
                        const pIdol = PIdols.getById(card.pIdolId);
                        if (pIdol) mainTitle = pIdol.title;
                    }
                }
                if (loadout.skillCardIdGroups[1]?.[0] > 0) {
                    const card = SkillCards.getById(loadout.skillCardIdGroups[1][0]);
                    if (card && card.pIdolId) {
                        const pIdol = PIdols.getById(card.pIdolId);
                        if (pIdol) subTitle = pIdol.title;
                    }
                }
            }

            loadouts.push({
                ...loadout,
                id: name,
                idolName: idolName,
                deckDetails: {
                    mainTitle,
                    subTitle,
                    params: loadout.params || [0, 0, 0, 0],
                    pItems: pItemsList,
                    memory1: getCardGroup(0),
                    memory2: getCardGroup(1)
                }
            });
        }
    } finally {
        await client.close();
    }

    if (loadouts.length === 0) {
        console.error("No valid decks provided.");
        process.exit(1);
    }

    if (targetStageId === null) {
        console.error(`\n[エラー] デッキ内にステージID情報が保存されていませんでした。`);
        process.exit(1);
    }

    const stages = Stages.getAll();
    const contestStage = stages.find((s) => s.id === targetStageId);
    if (!contestStage) {
        console.error(`\n[エラー] ステージID (${targetStageId}) に該当するステージが見つかりません。最新データを更新してください。`);
        process.exit(1);
    }
    const seasonStr = contestStage.season.toString();
    const stageStr = contestStage.stage.toString();

    // Run simulation
    const worker = new Worker(path.join(__dirname, 'simulate-loadout-worker.mjs'), {
        workerData: {
            contestStage,
            numRuns: runsArg
        }
    });

    let currentDeckIndex = 0;

    worker.on('message', (msg) => {
        if (msg.type === 'progress') {
            const { loadoutId, currentRun, totalRuns } = msg;
            // Clear current line and show progress
            process.stderr.write(`\r- 予測シミュレーション実行中 (${loadoutId}): ${currentRun}/${totalRuns} (${Math.round((currentRun / totalRuns) * 100)}%)    `);
        } else if (msg.type === 'done') {
            process.stderr.write(`\r- 予測シミュレーション完了!                                  \n`);
            const results = msg.results;

            // Assign idol name back to result based on loadout.id
            const finalIdols = results.map((r, index) => {
                const correspondingLoadout = loadouts.find(l => l.id === r.id) || loadouts[index];
                return {
                    id: r.id,
                    idolName: correspondingLoadout.idolName || r.id,
                    min: r.min,
                    score: Math.floor(r.score),
                    max: r.max,
                    deckDetails: correspondingLoadout.deckDetails
                };
            });

            // Helper to calculate score with 1.2x bonus for the highest
            const calcTotal = (key) => {
                const sorted = [...finalIdols].sort((a, b) => b[key] - a[key]);
                let total = 0;
                if (sorted.length > 0) {
                    total += sorted[0][key] * 1.2;
                    for (let i = 1; i < sorted.length; i++) {
                        total += sorted[i][key];
                    }
                }
                return Math.floor(total);
            };

            const planMap = { "sense": "センス", "logic": "ロジック", "anomaly": "アノマリー" };
            const planName = planMap[contestStage.plan] || contestStage.plan;

            const finalData = {
                season: seasonStr,
                stage: stageStr,
                plan: planName,
                runs: runsArg,
                idols: finalIdols,
                totalScore: calcTotal('score'),
                totalMin: calcTotal('min'),
                totalMax: calcTotal('max')
            };

            console.log(JSON.stringify(finalData));
            process.exit(0);
        }
    });

    worker.on('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(new Error(`Worker stopped with exit code ${code}`));
            process.exit(1);
        }
    });

    worker.postMessage({ id: 'rehearsal', loadouts });
}

run();
