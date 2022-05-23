/**
 * Сигнал sma-crossover.
 * Рассчитываем быстрое и медленное скользящее среднее (быстрый и медленный тренд).
 * Далее находим точки, где быстрый тренд пересекает медленный:
 * - если пересекает снизу вверх, считаем что цена будет расти -> сигнал к покупке
 * - если пересекает сверху вниз, считаем что цена будет падать -> сигнал к продаже
 */

/* eslint-disable max-statements */

import { Strategy } from '../strategy.js';
import { crossover, crossunder, sma } from '../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from './base.js';

const defaultConfig = {
  /** Кол-во точек для расчета быстрого тренда */
  fastLength: 10,
  /** Кол-во точек для расчета медленного тренда */
  slowLength: 30,
};

export type SmaCrossoverSignalConfig = typeof defaultConfig;

export class SmaCrossoverSignal extends Signal<SmaCrossoverSignalConfig> {
  constructor(protected strategy: Strategy, config: SmaCrossoverSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.slowLength + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const closePrices = this.getPrices(candles, 'close');
    const fastMa = sma(closePrices, this.config.fastLength);
    const slowMa = sma(closePrices, this.config.slowLength);

    this.plot('price', closePrices, candles);
    this.plot('fastMa', fastMa, candles);
    this.plot('slowMa', slowMa, candles);

    if (crossover(fastMa, slowMa)) {
      this.logger.warn(`Цена начала расти, покупаем`);
      return 'buy';
    }
    if (crossunder(fastMa, slowMa) && profit > 0) {
      this.logger.warn(`Цена начала падать, продаем`);
      return 'sell';
    }
  }
}
