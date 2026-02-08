import { CAC } from 'cac';
import { runScript } from '../utils/runner';

export function registerSimCommand(cli: CAC) {
    cli.command('sim <seasonStage>', 'Run simulation')
        .option('--main <file>', 'Main memory JSON file')
        .option('--sub <file>', 'Sub memory JSON file')
        .option('--iterations <num>', 'Number of iterations', { default: 100 })
        .action(async (seasonStage, options) => {
            const args = [seasonStage];
            if (options.main) args.push('--main', options.main);
            if (options.sub) args.push('--sub', options.sub);
            if (options.iterations) args.push('--iterations', String(options.iterations));

            try {
                await runScript('my-simulator.mjs', args);
            } catch (error) {
                console.error('Simulation failed:', error);
                process.exit(1);
            }
        });
}
