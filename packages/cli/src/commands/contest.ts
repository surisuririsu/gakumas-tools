import { runScript } from '../utils/runner';
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

            // Always use JSON if we want to template it.
            // But we only want to suppress console output if we are templating.
            // If the user did NOT pass --json to CLI, we still run with --json to capture output,
            // but then we render the template.

            args.push('--json');

            try {
                const output = await runScript('boot-contest.mjs', args, { captureOutput: true }) as string;

                // Parse JSON
                let dataItems: any[] = parseJsonStream(output);

                if (dataItems.length === 0) {
                    // Fallback attempt for single potentially malformed or just plain single JSON
                    try {
                        dataItems.push(JSON.parse(output));
                    } catch (e) {
                        // ignore
                    }
                }

                if (dataItems.length === 0) {
                    console.error("No valid JSON output found from script.");
                    // Consider logging output for debug if needed
                    // console.error(output);
                    process.exit(1);
                }

                if (options.json) {
                    // If user explicitly asked for JSON, output raw JSON
                    // If multiple items, output as array
                    if (dataItems.length === 1) {
                        console.log(JSON.stringify(dataItems[0], null, 2));
                    } else {
                        console.log(JSON.stringify(dataItems, null, 2));
                    }
                } else {
                    // Render Template
                    const templatePath = path.join(__dirname, '../templates/contest.hbs');
                    const templateContent = fs.readFileSync(templatePath, 'utf-8');
                    const template = Handlebars.compile(templateContent);

                    dataItems.forEach((data, index) => {
                        if (index > 0) console.log('\n\n'); // Separator

                        if (options.compare) {
                            // If compare mode, we can add a flag to data to change headings or display
                            (data as any).isCompare = true;
                            (data as any).comparePattern = options.compare;

                            // Re-filter worstCombinations to strictly match the pattern if it was broad
                            const pattern = new RegExp(options.compare.replace(/\*/g, '.*'));
                            (data as any).compareResults = (data as any).worstCombinations.filter((c: any) =>
                                c.mainName && pattern.test(c.mainName)
                            );
                            // Sort by score descending (Strongest first for comparison)
                            (data as any).compareResults.sort((a: any, b: any) => b.score - a.score);
                        }

                        console.log(template(data));
                    });
                }

            } catch (error) {
                console.error('Remote optimization failed:', error);
                process.exit(1);
            }
        });
}
