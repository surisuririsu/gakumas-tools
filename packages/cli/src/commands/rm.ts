
import { CAC } from 'cac';
import { runScript } from '../utils/runner';

export function registerRmCommand(cli: CAC) {
    cli.command('rm <pattern>', 'Interactively delete memories matching pattern')
        .action(async (pattern: string) => {
            if (!process.env.MONGODB_URI) {
                console.error('Error: MONGODB_URI is not set in environment (check .env.local)');
                process.exit(1);
            }

            try {
                // Use boot-rm.mjs or similar if loader is needed, 
                // but since boot-list.mjs exists, I'll create boot-rm.mjs
                await runScript('boot-rm.mjs', [pattern]);
            } catch (error) {
                console.error('Deletion command failed:', error);
                process.exit(1);
            }
        });
}
