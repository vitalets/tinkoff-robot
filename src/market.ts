/**
 * Работа с данными рынка.
 */
import { SecurityTradingStatus } from 'tinkoff-invest-api/dist/generated/common.js';
import { Instrument, InstrumentIdType } from 'tinkoff-invest-api/dist/generated/instruments.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { RobotModule } from './base.js';

export class Market extends RobotModule {
  candles: HistoricCandle[] = [];
  instrument?: Instrument;

  /**
   * Загрузка данных об инструменте.
   */
  async loadInstrumentState() {
    const { instrument } = await this.api.instruments.getInstrumentBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
      classCode: '',
      id: this.config.figi
    });
    this.instrument = instrument;
  }

  /**
   * Доступны ли торги по инструменту.
   */
  isTradingAvailable() {
    const status = this.instrument?.tradingStatus;
    const isAvailable = status === SecurityTradingStatus.SECURITY_TRADING_STATUS_NORMAL_TRADING;
    if (!isAvailable) this.logger.log(`Торги недоступны: ${status}`);
    return isAvailable;
  }

  /**
   * Загружаем свечи.
   * todo: Возможно несколько запросов, чтобы набрать необходимое кол-во свечей.
   * todo: в простейшем варианте можно учитывать стандартную неделю и дозагружать с пятницы
   * todo: кешировать.
   */
  async loadCandles() {
    const { figi, interval } = this.config;
    this.logger.log(`Загружаю свежие свечи для ${figi} ...`);
    // const { from, to } = Helpers.fromTo(getTimeOffset());
    const { from, to } = this.api.helpers.fromTo('-1d');
    const { candles } = await this.api.marketdata.getCandles({ figi, interval, from, to });
    this.candles = candles;
    this.logger.log(`Свечи загружены: ${candles.length}`);
  }

  /**
   * Текущая цена.
   */
  getCurrentPrice() {
    const close = this.candles[ this.candles.length - 1 ].close!;
    return this.api.helpers.toNumber(close);
  }
}

  // getCandlesTimeOffset() {
  //   const { slowLength, interval } =
  //   // кол-во точек берем с запасом

  //   const points = this.config.slowLength + 3;
  //   switch (this.config.interval) {
  //     case CandleInterval.CANDLE_INTERVAL_1_MIN: return `-${points}m`;
  //     case CandleInterval.CANDLE_INTERVAL_5_MIN: return `-${points * 5}m`;
  //     case CandleInterval.CANDLE_INTERVAL_15_MIN: return `-${points * 15}m`;
  //     case CandleInterval.CANDLE_INTERVAL_HOUR: return `-${points}h`;
  //     case CandleInterval.CANDLE_INTERVAL_DAY: return `-${points}d`;
  //     default: throw new Error(`Invalid interval: ${this.config.interval}`);
  //   }
  // }
