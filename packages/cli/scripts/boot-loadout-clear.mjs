import { MongoClient } from "mongodb";

const MONGODB_URI = process.argv[2];

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is required.");
    process.exit(1);
}

try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gakumas-tools");
    const loadouts = db.collection("loadouts");

    const result = await loadouts.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} loadout(s).`);

    await client.close();
    process.exit(0);
} catch (error) {
    console.error("Failed to clear loadouts:", error);
    process.exit(1);
}
