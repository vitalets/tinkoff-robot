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
  */
import { api } from './init-api.js';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';

const cliFlags = {
  useRealAccount: process.argv.some(a => a === '--real'),
  dryRun: process.argv.some(a => a === '--dry-run'),
};
const intervalMinutes = 1;

main();

async function main() {
  const finalConfig = { ...config, ...cliFlags };
  const robot = new Robot(api, finalConfig);
  while (true) {
    await robot.runOnce();
    await sleep(intervalMinutes);
  }
}

async function sleep(minutes: number) {
  return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}
