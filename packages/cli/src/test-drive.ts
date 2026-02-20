
import { GoogleDriveClient } from './utils/gdrive';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local manually since we aren't using index.ts
const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../gakumas-tools/gakumas-tools/.env.local'),
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`Loading env from ${p}`);
        const content = fs.readFileSync(p, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        });
        break;
    }
}

async function run() {
    console.log('--- Google Drive Connectivity Test (List & Upload) ---');
    try {
        await GoogleDriveClient.init();

        // HACK: Access the private auth client to list files
        const auth = (GoogleDriveClient as any).auth;
        const drive = google.drive({ version: 'v3', auth });
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log(`Checking folder visibility: ${folderId}`);
        const listRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        console.log(`Files found in folder: ${listRes.data.files?.length || 0}`);
        listRes.data.files?.forEach(f => console.log(` - ${f.name} (${f.id})`));

        console.log('Attempting upload...');
        await GoogleDriveClient.uploadFile('test_connectivity_retry.txt', 'Hello from Gakumas Tools CLI (Retry)!');

    } catch (e: any) {
        console.error('Test failed:', e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

run();
