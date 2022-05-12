/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 */
import { Backtest } from 'tinkoff-invest-api';
import { Robot } from '../src/index.js';
import { config } from '../src/config.js';

const backtest = new Backtest({
  candles: 'data/candles/BBG004730N88/1_min/2022-05-12.json',
  instruments: { shares: 'data/shares.json'},
  initialCandleIndex: config.slowLength,
  initialCapital: 100_000,
});

main();

async function main() {
  console.warn(`Бэктест стратегии на исторических свечах...`);
  const robot = new Robot(backtest.api, config);
  while (await backtest.tick()) {
    await robot.tick();
  }
  const finalCapital = await backtest.getCapital();
  const profit = finalCapital - backtest.options.initialCapital;
  console.warn(`Капитал: ${finalCapital.toFixed(2)} (${profit > 0 ? '+' : ''}${profit.toFixed(2)} rub)`);
}

