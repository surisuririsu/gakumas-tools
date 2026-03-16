import { MongoClient } from "mongodb";
(async () => {
    const client = new MongoClient("mongodb://192.168.100.23:27017");
    try {
        await client.connect();
        const db = client.db("gakumas-tools");
        
        // Memories migration
        const memoriesCol = db.collection("memories");
        const memories = await memoriesCol.find({}).toArray();
        let changed = 0;
        for (const mem of memories) {
            if (mem.name) {
                // Match YY/MM/DD followed by a half-width or full-width space
                const newName = mem.name.replace(/^(\d{2}\/\d{2}\/\d{2})[ 　]/, "$1＿");
                if (newName !== mem.name) {
                    await memoriesCol.updateOne({ _id: mem._id }, { $set: { name: newName } });
                    changed++;
                }
            }
        }
        console.log(`Updated ${changed} memories names.`);

        // Delete all loadouts
        const loadoutsCol = db.collection("loadouts");
        const delRes = await loadoutsCol.deleteMany({});
        console.log(`Deleted ${delRes.deletedCount} loadouts.`);

    } finally {
        await client.close();
    }
})();
