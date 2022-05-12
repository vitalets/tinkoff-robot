/**
 * Стратегия: SMA crossover strategy.
 * Рассчитываем быстрое и медленное скользящее среднее (быстрый и медленный тренд).
 * Далее находим точки, где быстрый тренд пересекает медленный:
 * - если пересекает снизу вверх, считаем что цена будет расти -> сигнал к покупке
 * - если пересекает сверху вниз, считаем что цена будет падать -> сигнал к продаже
 */

/* eslint-disable max-statements */

import { Helpers } from 'tinkoff-invest-api';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { sma, crossover, crossunder } from './indicators.js';
import { RobotModule } from './base.js';

export type StrategyResult = 'buy' | 'sell';

export class Strategy extends RobotModule {
  run(candles: HistoricCandle[]) {
    const { time } = candles[candles.length - 1];
    const closePrices = candles.map(candle => Helpers.toNumber(candle.close!));
    const fastMa = sma(closePrices, this.config.fastLength);
    const slowMa = sma(closePrices, this.config.slowLength);
    if (crossover(fastMa, slowMa)) {
      this.logger.warn(`Сигнал к покупке: ${closePrices.pop()} (${time?.toLocaleString()})`);
      return 'buy';
    }
    if (crossunder(fastMa, slowMa)) {
      this.logger.warn(`Сигнал к продаже: ${closePrices.pop()} (${time?.toLocaleString()})`);
      return 'sell';
    }
  }
}
