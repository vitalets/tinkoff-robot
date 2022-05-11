/**
 * Конфигурация
 */
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';

export type Config = typeof config;

export const config = {
  /** Используем реальный счет или песочницу */
  useRealAccount: false,
  /** Комиссия брокера, % от суммы сделки */
  brokerFee: 0.3,
  /** При каком минусе относительно начальной цены продаем актив, % */
  stopLossPercent: 5,
  /** ID инструмента */
  figi: 'BBG004730N88',
  /** Кол-во лотов в заявке */
  orderLots: 1,
  /** Кол-во точек для расчета быстрого тренда */
  fastLength: 20,
  /** Кол-во точек для расчета медленного тренда */
  slowLength: 50,
  /** Интервал свечей */
  interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
};
