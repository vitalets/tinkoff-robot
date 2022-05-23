/**
 * Бэктест стратегии на исторических свечах:
 * npx ts-node-esm scripts/run-backtest.ts
 * DEBUG=tinkoff-invest-api:* npx ts-node-esm scripts/run-backtest.ts
 *
 * Предварительно нужно запустить сервер tinkoff-local-broker.
 */
import fs from 'fs';
import MockDate from 'mockdate';
import { Helpers } from 'tinkoff-invest-api';
import { Robot } from '../src/robot.js';
import { config } from '../src/config.js';
import { OperationState, OperationType } from 'tinkoff-invest-api/dist/generated/operations.js';
import { backtestApi as api } from './init-api.js';

// Диапазон дат для бэктеста
const from = new Date('2022-04-29T10:00:00+03:00');
const to = new Date('2022-04-29T15:00:00+03:00');

// Для бэктеста оставляем только первую стратегию
config.strategies = config.strategies.slice(0, 1);
const strategyConfig = config.strategies[0];

main();

async function main() {
  await configureBroker({ from, to, candleInterval: strategyConfig.interval });

  const robot = new Robot(api, { ...config, logLevel: 'info' });

  while (await tick()) {
    await robot.runOnce();
  }

  await showOperations();
  await showExpectedYield();
  buildCharts(robot);
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

function buildCharts(robot: Robot) {
  const strategy = robot.strategies[0];
  const charts = strategy.smaSignal?.charts;
  if (!charts) return;
  const series = Object.keys(charts).map(name => ({ name, data: charts[name] }));
  const seriesContent = JSON.stringify(series);
  const tpl = fs.readFileSync('chart/index.tpl.js', 'utf8');
  const newContent = tpl
    .replace('%ticker%', strategy.instrument.info?.ticker || strategy.config.figi)
    .replace('series: []', `series: ${seriesContent}`);
  fs.writeFileSync('chart/index.js', newContent);
}
