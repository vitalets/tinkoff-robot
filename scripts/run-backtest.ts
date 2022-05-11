/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 */
import { Backtest } from 'tinkoff-invest-api';
import { Robot } from '../src/index.js';
import { config } from '../src/config.js';
import { OperationState } from 'tinkoff-invest-api/dist/generated/operations.js';

const backtest = new Backtest({
  candles: 'data/candles/BBG004730N88/1_min/2022-05-11.json',
  instruments: { shares: 'data/shares.json'},
  initialCandleIndex: 50,
  initialCapital: 100_000,
});

main();

async function main() {
  console.log(`Бэктест стратегии на исторических свечах...`);
  const robot = new Robot(backtest.api, config);
  while (await backtest.tick()) {
    await robot.tick();
  }
  const { initialCapital } = backtest.options;
  const finalCapital = await backtest.getCapital();
  const profit = 100 * (finalCapital - initialCapital) / initialCapital;
  console.log(`Капитал: ${finalCapital} (${profit.toFixed(2)}%)`);
  // const operations = await backtest.operations.getOperations({
  //   accountId: '',
  //   figi: config.figi,
  //   state: OperationState.OPERATION_STATE_EXECUTED
  // });
  // console.log(JSON.stringify(operations, null, 2));
}

