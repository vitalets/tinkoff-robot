/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 * DEBUG=tinkoff-invest-api:* npx ts-node-esm scripts/run-backtest.ts
 */
import { Backtest, Helpers } from 'tinkoff-invest-api';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';
import { OperationState, OperationType } from 'tinkoff-invest-api/dist/generated/operations.js';

const strategyConfig = config.strategies[0];

const backtest = new Backtest({
  token: process.env.TINKOFF_API_TOKEN!,
  candleInterval: strategyConfig.interval,
  ...Helpers.fromTo('1d', new Date('2022-05-18T10:00:00+03:00')),
});

main();

async function main() {
  console.warn(`Бэктест стратегии на исторических свечах...`);
  const robot = new Robot(backtest.api, {...config, logLevel: 'info' });

  while (await backtest.tick()) {
    await robot.runOnce();
  }

  await showExpectedYield();
  await showOperations();
}

async function showExpectedYield() {
  const { expectedYield } = await backtest.api.operations.getPortfolio({ accountId: '' });
  console.log(`Прибыль: ${Helpers.toNumber(expectedYield)}%`);
}

async function showOperations() {
  console.log(`Операции:`);
  const { operations } = await backtest.operations.getOperations({
    figi: strategyConfig.figi,
    state: OperationState.OPERATION_STATE_EXECUTED,
    accountId: ''
  });
  operations
    .filter(o => o.operationType !== OperationType.OPERATION_TYPE_BROKER_FEE)
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
