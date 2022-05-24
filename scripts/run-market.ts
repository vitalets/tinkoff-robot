/**
 * Запуск робота на рыночных данных.
 *
 * В песочнице (по умолчанию):
 * npx ts-node-esm scripts/run-market.ts
 *
 * На реальном счете (без создания заявок):
 * npx ts-node-esm scripts/run-market.ts --real --dry-run
 *
 * На реальном счете (с созданием заявок):
 * npx ts-node-esm scripts/run-market.ts --real
 *
 * Для разового запуска по расписанию можно указать флаг cron:
 * npx ts-node-esm scripts/run-market.ts --real --dry-run --cron
 */
import { api } from './init-api.js';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const cliFlags = {
  useRealAccount: process.argv.some(a => a === '--real'),
  dryRun: process.argv.some(a => a === '--dry-run'),
  cron: process.argv.some(a => a === '--cron')
};
const delay = intervalToMs(config.strategies[0].interval);

main();

async function main() {
  const finalConfig = { ...config, ...cliFlags };
  const robot = new Robot(api, finalConfig);
  if (cliFlags.cron) {
    await robot.runOnce();
    return;
  }
  while (true) {
    await robot.runOnce();
    await sleep(delay);
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function intervalToMs(interval: CandleInterval) {
  switch (interval) {
    case CandleInterval.CANDLE_INTERVAL_1_MIN: return 60 * 1000;
    case CandleInterval.CANDLE_INTERVAL_5_MIN: return 5 * 60 * 1000;
    case CandleInterval.CANDLE_INTERVAL_15_MIN: return 15 * 60 * 1000;
    case CandleInterval.CANDLE_INTERVAL_HOUR: return 60 * 60 * 1000;
    case CandleInterval.CANDLE_INTERVAL_DAY: return 24 * 60 * 60 * 1000;
    default: throw new Error(`Invalid interval`);
  }
}
