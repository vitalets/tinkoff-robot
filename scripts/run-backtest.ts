/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 */
import { Backtest } from 'tinkoff-invest-api';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';
import { OperationState } from 'tinkoff-invest-api/dist/generated/operations.js';

const backtest = new Backtest({
  candles: [
    'data/candles/BBG004730N88/5_min/2022-05-11.json',
    'data/candles/BBG004730N88/5_min/2022-05-12.json',
  ],
  instruments: { shares: 'data/shares.json'},
  initialCandleIndex: config.slowLength,
  initialCapital: 100_000,
});

main();

async function main() {
  console.warn(`Бэктест стратегии на исторических свечах...`);
  const robot = new Robot(backtest.api, {...config, logLevel: 'warn' });
  while (await backtest.tick()) {
    await robot.tick();
  }
  const finalCapital = await backtest.getCapital();
  const profit = finalCapital - backtest.options.initialCapital;
  console.warn(`Капитал: ${finalCapital.toFixed(2)} (${profit > 0 ? '+' : ''}${profit.toFixed(2)} rub)`);

  await showOperations();
}

export async function showOperations() {
  console.log(`Операции:`);
  const { operations } = await backtest.operations.getOperations({
    figi: config.figi,
    state: OperationState.OPERATION_STATE_EXECUTED,
    accountId: ''
  });
  operations
    .forEach(o => {
    const s = [
      ' '.repeat(4),
      o.date?.toLocaleString(),
      o.type,
      o.figi,
      o.quantity > 0 && `(${o.quantity})`,
      `${backtest.api.helpers.toNumber(o.payment)} ${o.payment?.currency}`,
    ].filter(Boolean).join(' ');
    console.log(s);
  });
}
