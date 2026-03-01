import { spawn } from 'child_process';
import { LOCAL_SCRIPTS_DIR, GAKUMAS_TOOLS_ROOT } from '../utils/runner';
import * as fs from 'fs';
import * as path from 'path';
import importHandlebars from 'handlebars';

const Handlebars = importHandlebars;

export function registerRehearsalCommand(cli: any) {
    cli.command('rehearsal <stage> <runs> [...decks]', 'Rehearsal mode to predict total score for 3 decks')
        .action(async (stage: string, runs: string, decks: string[], options?: any) => {
            if (!process.env.MONGODB_URI) {
                console.error('Error: MONGODB_URI is not set in environment (check .env.local)');
                process.exit(1);
            }

            if (!decks || decks.length === 0) {
                console.error('Error: You must provide at least one deck name.');
                process.exit(1);
            }

            const args = [process.env.MONGODB_URI!, stage, runs, ...decks];

            try {
                const templatePath = path.join(__dirname, '../templates/rehearsal.hbs');
                const templateContent = fs.readFileSync(templatePath, 'utf-8');
                const template = Handlebars.compile(templateContent);

                const scriptPath = path.join(LOCAL_SCRIPTS_DIR, 'boot-rehearsal.mjs');
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

                try {
                    const resultData = JSON.parse(outputBuffer.trim());
                    if (resultData && resultData.season) {
                        console.log(template(resultData));
                    }
                } catch (e) {
                    console.error("Failed to parse script output:", outputBuffer);
                    process.exit(1);
                }

            } catch (error) {
                console.error('Rehearsal simulation failed:', error);
                process.exit(1);
            }
        });
}
