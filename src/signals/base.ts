/**
 * Базовый класс для сигналов рынка.
 */
import { Logger } from '@vitalets/logger';
import { Helpers } from 'tinkoff-invest-api';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { Strategy } from '../strategy.js';

export type SignalResult = 'buy' | 'sell' | void;

export interface SignalParams {
  candles: HistoricCandle[],
  profit: number;
}

export abstract class Signal<T> {
  logger: Logger;
  
  constructor(protected strategy: Strategy, protected config: T) {
    this.logger = strategy.logger.withPrefix(`[${this.constructor.name}]:`);
  }

  abstract getMinCandlesCount(): number;
  abstract calc(req: SignalParams): SignalResult;

  protected getPrices(candles: HistoricCandle[], type: 'close' | 'open' | 'low' | 'high') {
    return candles.map(candle => Helpers.toNumber(candle[type]!));
  }
}
