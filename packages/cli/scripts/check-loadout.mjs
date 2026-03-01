import { MongoClient } from "mongodb";
import fs from "fs";

async function run() {
    let uri = process.env.MONGODB_URI;
    let dbName = process.env.MONGODB_DB || "gakumas-tools";

    if (!uri) {
        try {
            const lines = fs.readFileSync("/Users/shigehiro/gakumas-workspace/gakumas-tools/gakumas-tools/.env.local", "utf8").split("\n");
            for (const line of lines) {
                if (line.trim().startsWith("MONGODB_URI=")) uri = line.split("=")[1].replace(/["']/g, '');
                if (line.trim().startsWith("MONGODB_DB=")) dbName = line.split("=")[1].replace(/["']/g, '');
            }
        } catch (e) {
            console.error("No .env.local", e);
        }
    }

    if (!uri) {
        console.error("No MONGODB_URI");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const loadouts = await db.collection("loadouts").find({}).limit(1).toArray();
        console.log("Loadout:", JSON.stringify(loadouts[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
