/**
 * Стратегия: SMA crossover strategy.
 * Рассчитываем быстрое и медленное скользящее среднее (быстрый и медленный тренд).
 * Далее находим точки, где быстрый тренд пересекает медленный:
 * - если пересекает снизу вверх, считаем что цена будет расти -> сигнал к покупке
 * - если пересекает сверху вниз, считаем что цена будет падать -> сигнал к продаже
 */
import { Helpers } from 'tinkoff-invest-api';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { ema, crossover, crossunder } from './indicators.js';
import { RobotModule } from './base.js';

export type StrategyResult = 'buy' | 'sell';

export class Strategy extends RobotModule {
  run(candles: HistoricCandle[]) {
    const closePrices = candles.map(candle => Helpers.toNumber(candle.close!));
    const fastMa = ema(closePrices, this.config.fastLength);
    const slowMa = ema(closePrices, this.config.slowLength);
    if (crossover(fastMa, slowMa)) {
      this.logger.warn('Цена начинает расти, сигнал к покупке');
      return 'buy';
    }
    if (crossunder(fastMa, slowMa)) {
      this.logger.warn('Цена начинает падать, сигнал к продаже');
      return 'sell';
    }
    this.logger.log('Тренд не меняется, ничего не делаем');
  }
}
