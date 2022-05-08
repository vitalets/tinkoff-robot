/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 */
import fs from 'fs';
import { runStrategy } from '../src/strategy.js';
import { config } from '../src/config.js';
import { GetCandlesResponse } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { Helpers } from 'tinkoff-invest-api/dist/helpers.js';

const candlesFile = 'data/candles_BBG004730N88.json';

main();

async function main() {
  const { candles } = loadJson(candlesFile) as GetCandlesResponse;
  console.log(`Бэктест стратегии на исторических свечах...`);
  for (let i = 1; i < candles.length; i++) {
    const curCandles = candles.slice(0, i);
    const result = runStrategy(curCandles, config);
    if (result) {
      const { time, close } = candles[i];
      const date = new Date(time as unknown as string).toLocaleString()
      console.log(date, result, Helpers.toNumber(close));
    }
  }
  console.log(`Done.`);
}

function loadJson(file: string) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
