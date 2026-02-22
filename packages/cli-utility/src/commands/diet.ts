import { CAC } from 'cac';
import { runScript } from '../utils/runner';

export function registerDietCommand(cli: CAC) {
    cli.command('diet [plan] [idol] [threshold]', 'Remove or find duplicate memories')
        // The original script arguments are a bit loose:
        // ./local-run diet
        // ./local-run diet <plan> <idol> [threshold]
        .action(async (plan, idol, threshold) => {
            const args = [];
            if (plan) args.push(plan);
            if (idol) args.push(idol);
            if (threshold) args.push(String(threshold));

            try {
                await runScript('boot-duplicates.mjs', args);
            } catch (error) {
                console.error('Diet failed:', error);
                process.exit(1);
            }
        });
}
