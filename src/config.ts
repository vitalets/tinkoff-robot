/**
 * Конфигурация.
 */
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { RobotConfig } from './robot.js';

export const config: RobotConfig = {
  /** Используем реальный счет или песочницу */
  useRealAccount: false,
  /** Уровень логирования */
  logLevel: 'info',
  /** Используемые стратегии: */
  strategies: [
    {
      /** ID инструмента */
      figi: 'BBG004731354',
      /** По сколько лотов покупаем/продаем */
      orderLots: 1,
      /** Комиссия брокера, % от суммы сделки */
      brokerFee: 0.3,
      /** Интервал свечей */
      interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
      /** Конфиг сигнала по отклонению текущей цены */
      profit: {
        /** При каком % превышении цены продаем актив, чтобы зафиксировать прибыль */
        takeProfit: 15,
        /** При каком % снижении цены продаем актив, чтобы не потерять еще больше */
        stopLoss: 5,
      },
      /** Конфиг сигнала по скользящим средним */
      sma: {
        /** Кол-во точек для расчета быстрого тренда */
        fastLength: 10,
        /** Кол-во точек для расчета медленного тренда */
        slowLength: 30,
      },
      /** Конфиг сигнала по RSI */
      rsi: {
        /** Кол-во точек для расчета rsi */
        period: 14,
        /** Верхний уровень */
        highLevel: 70,
        /** Нижний уровень */
        lowLevel: 30,
      }
    },
  ]
};
