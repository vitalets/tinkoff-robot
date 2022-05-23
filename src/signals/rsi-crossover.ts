/**
 * Сигнал rsi-crossover.
 * Рассчитываем значение RSI и ловим его пересечение с уровнями.
 */

/* eslint-disable max-statements */

import { Strategy } from '../strategy.js';
import { crossover, crossunder, rsi, toSeries} from '../utils/indicators.js';
import { Signal, SignalParams, SignalResult } from './base.js';

const defaultConfig = {
  /** Кол-во точек для расчета rsi */
  period: 14,
  /** Верхний уровень */
  highLevel: 70,
  /** Нижний уровень */
  lowLevel: 30,
};

export type RsiCrossoverSignalConfig = typeof defaultConfig;

export class RsiCrossoverSignal extends Signal<RsiCrossoverSignalConfig> {
  constructor(protected strategy: Strategy, config: RsiCrossoverSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return this.config.period + 1;
  }

  calc({ candles, profit }: SignalParams): SignalResult {
    const { period, lowLevel, highLevel } = this.config;
    const closePrices = this.getPrices(candles, 'close');
    const rsiValue = rsi(closePrices, period);
    const low = toSeries(lowLevel, period);
    const high = toSeries(highLevel, period);
    if (crossunder(rsiValue, low)) {
      this.logger.warn(`Актив перепродан, пора покупать`);
      return 'buy';
    }
    if (crossover(rsiValue, high) && profit > 0) {
      this.logger.warn(`Актив перекуплен, пора продавать`);
      return 'sell';
    }
  }
}
