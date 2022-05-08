/**
 * Загрузка исторических свечей.
 * npx ts-node-esm scripts/load-candles.ts
 */
import fs from 'fs';
import { api } from './init-api.js';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const figi = 'BBG004730N88';
const interval = CandleInterval.CANDLE_INTERVAL_1_MIN;
const { from, to } = api.helpers.fromTo('1d', new Date('2022-05-06T10:00:00+03:00'));

main();

async function main() {
  const data = await api.marketdata.getCandles({ figi, interval, from, to });
  fs.writeFileSync(`data/candles_${figi}.json`, JSON.stringify(data, null, 2));
  console.log('Candles saved', data.candles.length);
}
