import { MongoClient, ObjectId } from 'mongodb';

export class Database {
    public client: MongoClient | null = null;
    private dbName: string;

    constructor() {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not set");
        }
        this.client = new MongoClient(process.env.MONGODB_URI);
        this.dbName = process.env.MONGODB_DB || 'gakumas-tools';
    }

    async connect() {
        if (!this.client) return;
        await this.client.connect();
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }

    async getMemory(id: string) {
        if (!this.client) return null;
        const db = this.client.db(this.dbName);
        const collection = db.collection('memories');

        try {
            const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
            // @ts-ignore
            return await collection.findOne(query);
        } catch (e) {
            console.error("Error fetching memory:", e);
            return null;
        }
    }

    // Helper to list recent memories if no ID provided
    async getRecentMemories(limit = 5) {
        if (!this.client) return [];
        const db = this.client.db(this.dbName);
        const collection = db.collection('memories');
        return await collection.find({}).sort({ _id: -1 }).limit(limit).toArray();
    }
}
