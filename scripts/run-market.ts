/**
 * Запуск робота на рыночных данных.
 *
 * В песочнице (по умолчанию):
 * npx ts-node-esm scripts/run-market.ts
 *
 * На реальном счете:
 * npx ts-node-esm scripts/run-market.ts --real
 */
import { api } from './init-api.js';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';

const useRealAccount = process.argv.some(a => a === '--real');
const intervalMinutes = 1;

main();

async function main() {
  const finalConfig = { ...config, useRealAccount };
  const robot = new Robot(api, finalConfig);
  await robot.run(intervalMinutes);
}


