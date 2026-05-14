import { MongoClient } from "mongodb";
import { Stages, PItems, SkillCards, Customizations } from "gakumas-data";

const MONGODB_URI = process.argv[2];
const verbose = process.argv.includes('--verbose');

const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "gakumas-tools");
const loadouts = await db.collection("loadouts").find().sort({ createdAt: -1 }).toArray();

const results = [];
const stages = Stages.getAll();

for (const loadout of loadouts) {
    const stageInfo = stages.find(s => s.id === loadout.stageId);
    let stageName = "Unknown Stage";
    if (stageInfo) {
        stageName = `シーズン${stageInfo.season} ステージ${stageInfo.stage}`;
    }

    if (verbose) {
        const pItems = (loadout.pItemIds || []).filter(id => id > 0).map(id => {
            const item = PItems.getById(id);
            return item ? item.name : `Unknown(${id})`;
        });

        const getCardGroup = (index) => {
            const cardIds = loadout.skillCardIdGroups?.[index] || [];
            const custs = loadout.customizationGroups?.[index] || [];
            return cardIds.filter(id => id > 0).map((id, i) => {
                const card = SkillCards.getById(id);
                const name = card ? card.name : `Unknown(${id})`;
                const customObj = custs[i];
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

        results.push({
            name: loadout.name,
            stageName: stageName,
            params: loadout.params || [0, 0, 0, 0],
            pItems: pItems,
            memory1: getCardGroup(0),
            memory2: getCardGroup(1)
        });
    } else {
        results.push({
            name: loadout.name,
            stageName: stageName,
        });
    }
}

await client.close();
console.log(JSON.stringify(results));
process.exit(0);
