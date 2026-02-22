import { CAC } from 'cac';
import { runScript } from '../utils/runner';

export function registerDumpCommand(cli: CAC) {
    cli.command('dump [idolName] [outputFile]', 'Dump memories report')
        .action(async (idolName, outputFile, options) => {
            const args = [];
            if (idolName) args.push(idolName);
            if (outputFile) args.push(outputFile);

            try {
                // dump uses boot-dump.mjs
                await runScript('boot-dump.mjs', args);
            } catch (error) {
                console.error('Dump failed:', error);
                process.exit(1);
            }
        });
}
