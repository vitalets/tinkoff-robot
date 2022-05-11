/**
 * Загрузка исторических свечей.
 * npx ts-node-esm scripts/load-candles.ts
 */
import fs from 'fs';
import { api } from './init-api.js';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';

const figi = 'BBG004730N88';
const interval = CandleInterval.CANDLE_INTERVAL_1_MIN;
const startDate = '2022-05-11';
const duration = '1d';
const { from, to } = api.helpers.fromTo(duration, new Date(`${startDate}T10:00:00+03:00`));

main();

async function main() {
  const { candles } = await api.marketdata.getCandles({ figi, interval, from, to });
  const dir = `data/candles/${figi}/${candleIntervalToString(interval)}`;
  fs.mkdirSync(dir, { recursive: true });
  const file = `${dir}/${startDate}.json`;
  fs.writeFileSync(file, JSON.stringify(candles, null, 2));
  console.log('Candles saved', candles.length, `to ${file}`);
}

function candleIntervalToString(interval: CandleInterval) {
  return CandleInterval[interval].replace('CANDLE_INTERVAL_', '').toLowerCase();
}
