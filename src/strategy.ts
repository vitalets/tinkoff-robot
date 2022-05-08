/**
 * SMA crossover strategy.
 */
import { Logger } from '@vitalets/logger';
import { Helpers } from 'tinkoff-invest-api/dist/helpers.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { Config } from './config.js';
import { ema, crossover, crossunder } from './indicators.js';

const logger = new Logger({ prefix: '[strategy]:' });

export type StrategyResult = 'buy' | 'sell';

export function runStrategy(candles: HistoricCandle[], config: Config): StrategyResult | void {
  const closePrices = candles.map(candle => Helpers.toNumber(candle.close!));
  const fastMa = ema(closePrices, config.fastLength);
  const slowMa = ema(closePrices, config.slowLength);
  if (crossover(fastMa, slowMa)) {
    logger.log(`📈 Цена начинает расти, сигнал к покупке`);
    return 'buy';
  }
  if (crossunder(fastMa, slowMa)) {
    logger.log(`📉 Цена начинает падать, сигнал к продаже`);
    return 'sell';
  }
}
