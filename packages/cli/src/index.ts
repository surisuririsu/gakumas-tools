// @ts-ignore
import { cac } from 'cac';
import { registerDumpCommand } from './commands/dump';
import { registerContestCommand } from './commands/contest';
import { registerStatsCommand } from './commands/stats';
// @ts-ignore
import { registerListCommand } from './commands/list';
import { registerRmCommand } from './commands/rm';
import { registerRehearsalCommand } from './commands/rehearsal';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';

const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'), // Priority 1: Current working directory
    path.resolve(__dirname, '../../.env.local'), // Priority 2: Monorepo root (relative to dist/ or src/)
    path.resolve(__dirname, '../../../.env.local'), // Monorepo root (if __dirname is dist/[folder])
    path.resolve(__dirname, '../../../gakumas-tools/.env.local'), // Submodule fallback
    path.resolve(process.cwd(), 'gakumas-tools/.env.local') // Project root fallback
];

// console.log("Searching for .env.local in:", possiblePaths);

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        // console.log("Found .env.local at:", p);
        const content = fs.readFileSync(p, 'utf-8');
        // ... (rest same)
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Basic unquote
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        });
        break; // Stop after first find
    }
}


import { GlobalCapture } from './utils/capture';
import { GoogleDriveClient } from './utils/gdrive';

const cli = cac('yarn cli');

// Global option
cli.option('--gdrive <filename>', 'Upload standard output to Google Drive');

// Filter out `--` which might be inserted by yarn workspace start
const filteredArgsForCac = process.argv[0].includes('node')
    ? [process.argv[0], process.argv[1], ...process.argv.slice(2).filter(a => a !== '--')]
    : process.argv.filter(a => a !== '--');

// Helper to check and enable capture
const parsed = cli.parse(filteredArgsForCac, { run: false });
if (parsed.options.gdrive) {
    if (parsed.options.debug) {
        console.error(`[DEBUG] Google Drive upload enabled. Filename: ${parsed.options.gdrive}`);
    }
    GlobalCapture.enable();

    // Register exit handler
    let uploaded = false;
    process.on('beforeExit', async () => {
        if (uploaded) return;
        uploaded = true;

        const output = GlobalCapture.getCapturedOutput();
        if (output && output.trim().length > 0) {
            try {
                await GoogleDriveClient.uploadFile(parsed.options.gdrive, output);
            } catch (e) {
                console.error('Upload error in exit hook:', e);
            }
        }
    });
}

registerDumpCommand(cli);
registerContestCommand(cli);
registerStatsCommand(cli);
registerListCommand(cli);
registerRmCommand(cli);
registerRehearsalCommand(cli);

cli.help();
cli.version('0.1.0');

const parsedFinal = cli.parse(filteredArgsForCac);

if (!cli.matchedCommand && !parsedFinal.options.help && !parsedFinal.options.version) {
    cli.outputHelp();
}
