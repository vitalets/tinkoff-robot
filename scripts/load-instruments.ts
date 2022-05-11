/**
 * Загрузка доступных инструментов.
 * npx ts-node-esm scripts/load-instruments.ts
 */
import fs from 'fs';
import { api } from './init-api.js';
import { InstrumentStatus } from 'tinkoff-invest-api/dist/generated/instruments.js';

main();

async function main() {
  const { instruments } = await api.instruments.shares({ instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE });
  const file = `data/shares.json`;
  fs.writeFileSync(file, JSON.stringify(instruments, null, 2));
  console.log('Instruments saved', instruments.length, `to ${file}`);
}
