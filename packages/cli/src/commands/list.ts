
import { CAC } from 'cac';
import { runScript } from '../utils/runner';

export function registerListCommand(cli: CAC) {
    cli.command('list [idolName]', 'List memory names')
        .action(async (idolName, options) => {
            const args = [];
            if (idolName) args.push(idolName);

            try {
                // list uses boot-list.mjs
                await runScript('boot-list.mjs', args);
            } catch (error) {
                console.error('List failed:', error);
                process.exit(1);
            }
        });
}
