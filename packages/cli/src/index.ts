// @ts-ignore
import { cac } from 'cac';
import { registerDumpCommand } from './commands/dump';
import { registerContestCommand } from './commands/contest';
import { registerStatsCommand } from './commands/stats';
// @ts-ignore
import { registerListCommand } from './commands/list';
import { registerRmCommand } from './commands/rm';
import { registerRehearsalCommand } from './commands/rehearsal';
import { registerLoadoutCommand } from './commands/loadout';
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
cli.option('--gdrive [filename]', 'Upload standard output to Google Drive');

// Filter out `--` which might be inserted by yarn workspace start
const filteredArgsForCac = process.argv[0].includes('node')
    ? [process.argv[0], process.argv[1], ...process.argv.slice(2).filter(a => a !== '--')]
    : process.argv.filter(a => a !== '--');

// Helper to check and enable capture
const parsed = cli.parse(filteredArgsForCac, { run: false });
if (parsed.options.gdrive || parsed.options.gdrive === '') {
    // Generate default filename if not provided
    if (parsed.options.gdrive === true || parsed.options.gdrive === '') {
        const now = new Date();
        // Since timezone is fixed to +09:00 locally, but we can just use local string formatting
        // that padStart ensures JS local date components match YY-MM-DD
        const yy = String(now.getFullYear()).slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${yy}-${mm}-${dd}`;

        let defaultName = `${datePrefix}_output.md`; // Fallback

        // Check which command was matched
        const cmdName = parsed.args[0];

        if (cmdName === 'contest') {
            const stage = parsed.args[1] || 'unknown';
            // runs is args[2], idolName could be args[2] or args[3]
            // We can check options or fallback to parsing args
            // However, cac parser stores positional arguments in parsed.args
            // [ 'contest', '40-1', '100', 'all' ]
            let idols = 'all';
            if (parsed.args.length > 3) {
                idols = parsed.args[3]; // format: contest 40-1 100 sumika
            } else if (parsed.args.length === 3 && isNaN(Number(parsed.args[2]))) {
                idols = parsed.args[2]; // format: contest 40-1 sumika
            }
            idols = idols.replace(/,/g, '+');
            defaultName = `${datePrefix}_${stage}_${idols}.md`;
        } else if (cmdName === 'rehearsal') {
            // [ 'rehearsal', '1000', '26-03-06_40-3_sumika', '26-03-06_40-3_ume', ... ]
            const decks = parsed.args.slice(2);
            if (decks.length > 0) {
                // Determine stage from the first deck if it follows the typical pattern YY-MM-DD_ST-GE_idol
                // e.g., '26-03-06_40-3_sumika' -> '40-3'
                let stageStr = 'unknown';
                const firstDeckParts = decks[0].split('_');
                if (firstDeckParts.length >= 3) {
                    stageStr = firstDeckParts[1];
                }

                // Extract idol names
                const idols = decks.map(d => {
                    const parts = d.split('_');
                    return parts[parts.length - 1]; // usually the last part is idol name
                }).join('+');

                defaultName = `${datePrefix}_${stageStr}_${idols}.md`;
            } else {
                defaultName = `${datePrefix}_rehearsal.md`;
            }
        } else if (cmdName === 'list') {
            const idolFilter = parsed.args[1];
            if (idolFilter) {
                defaultName = `${datePrefix}_list_${idolFilter.replace(/,/g, '+')}.md`;
            } else {
                defaultName = `${datePrefix}_list.md`;
            }
        } else if (cmdName === 'dump') {
            const idolName = parsed.args[1];
            if (idolName) {
                defaultName = `${datePrefix}_dump_${idolName.replace(/,/g, '+')}.md`;
            } else {
                defaultName = `${datePrefix}_dump.md`;
            }
        } else if (cmdName === 'stats') {
            const idolFilter = parsed.args[1] || 'summary';
            defaultName = `${datePrefix}_stats_${idolFilter.replace(/,/g, '+')}.md`;
        }

        parsed.options.gdrive = defaultName;
    }
}
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
registerLoadoutCommand(cli);

cli.help();
cli.version('0.1.0');

const parsedFinal = cli.parse(filteredArgsForCac);

if (!cli.matchedCommand && !parsedFinal.options.help && !parsedFinal.options.version) {
    cli.outputHelp();
}
