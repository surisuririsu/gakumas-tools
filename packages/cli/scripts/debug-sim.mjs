
import { Stages } from "gakumas-data";
import { StageConfig, IdolConfig, IdolStageConfig, StageEngine, StagePlayer, STRATEGIES } from "gakumas-engine";
import { MongoClient } from "mongodb";

async function run() {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    const db = client.db("gakumas-tools");
    const collection = db.collection("memories");
    
    // Get a Lilja memory
    const memory = await collection.findOne({ pIdolId: 134 });
    console.log("Memory P-Idol ID:", memory.pIdolId);
    console.log("Memory P-Items:", memory.pItemIds);
    console.log("Memory Params:", memory.params);
    
    if (!memory) {
        console.log("No Lilja memory found");
        return;
    }
    
    const pIdolId = 58; // Saki SSR 58
    const idolConfig = new IdolConfig(PIdols.getById(pIdolId), {
        params: [1000, 1000, 1500, 40],
        pItemIds: [401],
        skillCardIdGroups: [[363, 66]],
        supportBonus: 0.1244
    });

    const config = new IdolStageConfig(
        idolConfig,
        new StageConfig(Stages.getById(151))
    );
    const engine = new StageEngine(config);
    engine.logger.level = 'debug';
    
    const strategy = new STRATEGIES.HeuristicStrategy(engine);
    const player = new StagePlayer(engine, strategy);
    
    const result = await player.play();
    console.log("Final Score:", result.score);
    
    await client.close();
}

run();
