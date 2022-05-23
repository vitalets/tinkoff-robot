/**
 * Сигнал profit-loss.
 * При сильном отклонении текущей цены от начальной происходит продажа актива (takeProfit / stopLoss)
 */

import { Strategy } from '../strategy.js';
import { Signal, SignalParams, SignalResult } from './base.js';

const defaultConfig = {
  /** При каком % превышении цены продаем актив, чтобы зафиксировать прибыль */
  takeProfit: 15,
  /** При каком % снижении цены продаем актив, чтобы не потерять еще больше */
  stopLoss: 5,
};

export type ProfitLossSignalConfig = typeof defaultConfig;

export class ProfitLossSignal extends Signal<ProfitLossSignalConfig> {
  constructor(protected strategy: Strategy, config: ProfitLossSignalConfig) {
    super(strategy, Object.assign({}, defaultConfig, config));
  }

  get minCandlesCount() {
    return 1;
  }

  calc({ profit }: SignalParams): SignalResult {
    const { takeProfit, stopLoss } = this.config;
    if (profit >= takeProfit) {
      this.logger.warn(`Цена повысилась более чем на ${takeProfit}%, продаем`);
      return 'sell';
    }
    if (profit <= -stopLoss) {
      this.logger.warn(`Цена понизилась более чем на ${stopLoss}%, продаем`);
      return 'sell';
    }
  }
}
