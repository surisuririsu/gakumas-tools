import { CAC } from 'cac';
import { runScript } from '../utils/runner';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

export function registerStatsCommand(cli: any) {
    cli.command('stats [idol] [plan]', 'Show memory stats')
        .option('--json', 'Output results as JSON')
        .action(async (idol?: string, plan?: string, options?: any) => {
            const args = [];
            // Add arguments to args list
            if (idol) args.push(idol);
            if (plan) args.push(plan);

            // Always request JSON for processing
            args.push('--json');

            try {
                // stats uses boot-stats.mjs
                const output = await runScript('boot-stats.mjs', args, { captureOutput: true }) as string;

                let data;
                try {
                    data = JSON.parse(output);
                } catch (e) {
                    console.error('Failed to parse JSON output:', output);
                    throw e;
                }

                if (options.json) {
                    console.log(JSON.stringify(data, null, 2));
                } else {
                    let templateName = 'stats.hbs';
                    if (data.type === 'idol') templateName = 'stats-idol.hbs';
                    else if (data.type === 'all_idols') templateName = 'stats-idol.hbs';
                    else if (data.type === 'overall') templateName = 'stats.hbs';

                    const templatePath = path.join(__dirname, '../templates', templateName);
                    if (!fs.existsSync(templatePath)) {
                        throw new Error(`Template not found: ${templatePath}`);
                    }
                    const templateContent = fs.readFileSync(templatePath, 'utf-8');
                    const template = Handlebars.compile(templateContent);

                    if (data.type === 'all_idols') {
                        for (const idolData of data.data) {
                            console.log(template({ data: idolData }));
                            console.log('');
                        }
                    } else {
                        console.log(template(data));
                    }
                }

            } catch (error) {
                console.error('Stats command failed:', error);
                process.exit(1);
            }
        });
}
