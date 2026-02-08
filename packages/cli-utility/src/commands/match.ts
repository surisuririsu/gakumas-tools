
import { CAC } from 'cac';
import { runScript } from '../utils/runner';

export function registerMatchCommand(cli: CAC) {
    cli.command('match', 'Find memories that match a saved deck')
        .option('--deck <name>', 'Target deck name')
        .option('--list-loadouts', 'List available deck names')
        .option('--match <threshold>', 'Minimum match score (0.0 - 1.0)', { default: 0 })
        .action(async (options) => {
            if (!options.deck && !options.listLoadouts) {
                console.error('Error: --deck <name> or --list-loadouts is required');
                process.exit(1);
            }

            const args = [];
            if (options.deck) args.push('--deck', options.deck);
            if (options.listLoadouts) args.push('--list-loadouts');
            if (options.match) args.push('--match', options.match);

            try {
                await runScript('boot-match.mjs', args);
            } catch (error) {
                console.error('Match failed:', error);
                process.exit(1);
            }
        });
}
