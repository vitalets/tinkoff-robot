/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 * DEBUG=tinkoff-invest-api:* npx ts-node-esm scripts/run-backtest.ts
 *
 * Предварительно нужно запустить сервер tinkoff-local-broker.
 */
import MockDate from 'mockdate';
import { Helpers } from 'tinkoff-invest-api';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';
import { OperationState, OperationType } from 'tinkoff-invest-api/dist/generated/operations.js';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { backtestApi as api } from './init-api.js';

// Для бэктеста оставляем только первую стратегию
config.strategies = config.strategies.slice(0, 1);
const strategyConfig = config.strategies[0];

main();

async function main() {
  await configureBroker({
    from: new Date('2022-04-29T10:00:00+03:00'),
    to: new Date('2022-04-29T19:00:00+03:00'),
    candleInterval: CandleInterval.CANDLE_INTERVAL_1_MIN,
  });

  const robot = new Robot(api, { ...config, logLevel: 'info' });

  while (await tick()) {
    await robot.runOnce();
  }

  await showExpectedYield();
  await showOperations();
}

async function showExpectedYield() {
  const { expectedYield } = await api.operations.getPortfolio({ accountId: '' });
  console.log(`Прибыль: ${Helpers.toNumber(expectedYield)}%`);
}

async function showOperations() {
  console.log(`Операции:`);
  const { operations } = await api.operations.getOperations({
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
      `${api.helpers.toNumber(o.payment)} ${o.payment?.currency}`,
    ].filter(Boolean).join(' ');
    console.log(s);
  });
}

async function configureBroker(config: unknown) {
  await api.orders.postOrder({
    accountId: 'config',
    figi: JSON.stringify(config),
    quantity: 0,
    direction: 0,
    orderType: 0,
    orderId: '',
  });
}

async function tick() {
  const res = await api.orders.postOrder({
    accountId: 'tick',
    figi: '',
    quantity: 0,
    direction: 0,
    orderType: 0,
    orderId: '',
  });
  if (res.message) {
    MockDate.set(new Date(res.message));
    return true;
  } else {
    return false;
  }
}
