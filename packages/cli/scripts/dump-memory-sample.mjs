
import { MongoClient } from "mongodb";

const { MONGODB_URI, MONGODB_DB } = process.env;
if (!MONGODB_URI) {
    console.error("MONGODB_URI not set");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

async function run() {
    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");
        const sample = await collection.findOne({ name: { $exists: true } });
        console.log(JSON.stringify(sample, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
run();
