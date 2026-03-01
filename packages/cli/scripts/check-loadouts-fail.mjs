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

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const loadouts = await db.collection("loadouts").find({ name: { $in: ["40-1_sumika", "40-1_china"] } }).toArray();
        console.log("Loadouts:", JSON.stringify(loadouts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
