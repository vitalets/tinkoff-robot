/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 */
import { Backtest } from 'tinkoff-invest-api';
import { Robot } from '../src/index.js';
import { config } from '../src/config.js';

const backtest = new Backtest({
  candles: 'data/candles_BBG004730N88.json',
  instruments: { shares: 'data/shares.json'},
  initialCandleIndex: 50,
});

main();

async function main() {
  console.log(`Бэктест стратегии на исторических свечах...`);
  const robot = new Robot(backtest.api, config);
  while (await backtest.tick()) {
    await robot.tick();
  }
  console.log(await backtest.api.operations.getPortfolio({ accountId: '' }));
  console.log(`Done.`);
}
