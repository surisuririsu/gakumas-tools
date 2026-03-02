import { spawn } from 'child_process';
import { LOCAL_SCRIPTS_DIR, GAKUMAS_TOOLS_ROOT } from '../utils/runner';
import * as fs from 'fs';
import * as path from 'path';
import importHandlebars from 'handlebars';
import { parseJsonStream } from '../utils/json-stream';

const Handlebars = importHandlebars;

export function registerContestCommand(cli: any) {
    cli.command('contest <stage> [runs] [idolName] [plan]', 'Optimize memories using remote DB')
        .option('--synth', 'Simulate card synthesis')
        .option('--showWorst', 'Show worst combinations')
        .option('--json', 'Output results as JSON')
        .option('--compare <pattern>', 'Compare memories matching pattern (e.g. "再生成*")')
        .option('--force', 'Force re-calculate and overwrite cache')
        .option('--save', 'Save the best combination to loadouts')
        .option('--name <name>', 'Name for the saved loadout')
        .option('--userId <id>', 'User ID to save the loadout for')
        .option('--supportBonus <value>', 'Support bonus value (default: 0.04)')
        .action(async (stage: string, runs?: string, idolName?: string, plan?: string, options?: any) => {
            // Check if runs is actually idolName (if user skipped runs e.g. "contest 37-3 hiro")
            if (runs && isNaN(Number(runs))) {
                plan = idolName;
                idolName = runs;
                runs = undefined;
            }
            // opt-remote is a wrapper around optimize-memories-parallel.mjs
            // checking env vars
            if (!process.env.MONGODB_URI) {
                console.error('Error: MONGODB_URI is not set in environment (check .env.local)');
                process.exit(1);
            }

            // Construct arguments with positional args as expected by NEW upstream optimize-memories-parallel.mjs
            // formatting: <source> <season-stage> <num_runs> [options]
            const args = [process.env.MONGODB_URI!, stage];

            // runs is now required positionally or we pass default? 
            // The script says <num_runs> is required in usage, but code might output error.
            // Let's pass runs or default 1000 if undefined?
            // CLI arg runs is optional.
            args.push(runs || "1000");

            if (idolName) args.push(`--idolName`, idolName);
            if (plan) args.push(`--plan`, plan);

            // Pass synth/showWorst
            if (options.synth) args.push('--synth');
            if (options.showWorst) args.push('--showWorst');
            if (options.compare) args.push('--compare', options.compare);
            if (options.force) args.push('--force');
            if (options.save) args.push('--save');
            if (options.name) args.push('--name', options.name);
            if (options.userId) args.push('--userId', options.userId);
            if (options.supportBonus) args.push('--supportBonus', options.supportBonus);

            // Always use JSON if we want to template it.
            // But we only want to suppress console output if we are templating.
            // If the user did NOT pass --json to CLI, we still run with --json to capture output,
            // but then we render the template.

            args.push('--json');

            try {
                // Determine template if not raw JSON
                let template: any;
                if (!options.json) {
                    const templatePath = path.join(__dirname, '../templates/contest.hbs');
                    const templateContent = fs.readFileSync(templatePath, 'utf-8');
                    template = Handlebars.compile(templateContent);
                }

                const scriptPath = path.join(LOCAL_SCRIPTS_DIR, 'boot-contest.mjs');
                const child = spawn('yarn', ['node', scriptPath, ...args], {
                    cwd: GAKUMAS_TOOLS_ROOT,
                    stdio: ['inherit', 'pipe', 'inherit'],
                    env: { ...process.env }
                });

                let outputBuffer = '';
                let parsedCount = 0;

                child.stdout.on('data', (data) => {
                    outputBuffer += data.toString();

                    if (options.json) {
                        return; // Handle at the end
                    }

                    // On-the-fly rendering using parseJsonStream
                    let dataItems = parseJsonStream(outputBuffer);

                    while (parsedCount < dataItems.length) {
                        if (parsedCount > 0) console.log('\n\n');

                        const itemData = dataItems[parsedCount];
                        if (options.compare) {
                            (itemData as any).isCompare = true;
                            (itemData as any).comparePattern = options.compare;
                            const pattern = new RegExp(options.compare.replace(/\*/g, '.*'));
                            (itemData as any).compareResults = (itemData as any).worstCombinations.filter((c: any) =>
                                c.mainName && pattern.test(c.mainName)
                            );
                            (itemData as any).compareResults.sort((a: any, b: any) => b.score - a.score);
                        }

                        console.log(template(itemData));
                        parsedCount++;
                    }
                });

                await new Promise<void>((resolve, reject) => {
                    child.on('close', (code) => {
                        if (code === 0) resolve();
                        else reject(new Error(`Script exited with code ${code}`));
                    });
                    child.on('error', reject);
                });

                if (options.json) {
                    let dataItems = parseJsonStream(outputBuffer);
                    if (dataItems.length === 0) {
                        try {
                            dataItems.push(JSON.parse(outputBuffer));
                        } catch (e) { }
                    }
                    if (dataItems.length === 0) {
                        console.error("No valid JSON output found from script.");
                        process.exit(1);
                    }
                    if (dataItems.length === 1) {
                        console.log(JSON.stringify(dataItems[0], null, 2));
                    } else {
                        console.log(JSON.stringify(dataItems, null, 2));
                    }
                }

            } catch (error) {
                console.error('Remote optimization failed:', error);
                process.exit(1);
            }
        });
}
