import { spawn } from 'child_process';
import { LOCAL_SCRIPTS_DIR, GAKUMAS_TOOLS_ROOT } from '../utils/runner';
import * as fs from 'fs';
import * as path from 'path';
import importHandlebars from 'handlebars';

const Handlebars = importHandlebars;

export function registerLoadoutCommand(cli: any) {
    cli.command('loadout', 'List all saved loadouts')
        .option('--verbose', 'Show detailed loadout information')
        .action(async (options?: any) => {
            if (!process.env.MONGODB_URI) {
                console.error('Error: MONGODB_URI is not set in environment (check .env.local)');
                process.exit(1);
            }

            const args = [process.env.MONGODB_URI!];
            if (options.verbose) args.push('--verbose');

            try {
                const scriptPath = path.join(LOCAL_SCRIPTS_DIR, 'boot-loadout.mjs');
                const child = spawn(process.execPath, [scriptPath, ...args], {
                    cwd: GAKUMAS_TOOLS_ROOT,
                    stdio: ['inherit', 'pipe', 'inherit'],
                    env: { ...process.env }
                });

                let outputBuffer = '';
                child.stdout.on('data', (data) => {
                    outputBuffer += data.toString();
                });

                await new Promise<void>((resolve, reject) => {
                    child.on('close', (code) => {
                        if (code === 0) resolve();
                        else reject(new Error(`Script exited with code ${code}`));
                    });
                    child.on('error', reject);
                });

                const results = JSON.parse(outputBuffer.trim());
                if (!options.verbose) {
                    for (const res of results) {
                        console.log(`Name: ${res.name} / ${res.stageName}`);
                    }
                } else {
                    const templatePath = path.join(__dirname, '../templates/loadout.hbs');
                    if (fs.existsSync(templatePath)) {
                        const templateContent = fs.readFileSync(templatePath, 'utf-8');
                        const template = Handlebars.compile(templateContent);
                        for (const res of results) {
                            console.log(template(res));
                        }
                    } else {
                        console.error("Template loadout.hbs not found.");
                    }
                }
            } catch (error) {
                console.error('Loadout command failed:', error);
                process.exit(1);
            }
        });
}
