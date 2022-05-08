/**
 * Загрузка доступных инструментов.
 * npx ts-node-esm scripts/load-instruments.ts
 */
import fs from 'fs';
import { api } from './init-api.js';
import { InstrumentStatus } from 'tinkoff-invest-api/dist/generated/instruments.js';

main();

async function main() {
  const data = await api.instruments.shares({ instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE });
  fs.writeFileSync(`data/shares.json`, JSON.stringify(data, null, 2));
  console.log('Instruments saved', data.instruments.length);
}
