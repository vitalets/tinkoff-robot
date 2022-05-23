/**
 * Класс работы с конкретным инструментом по figi.
 */
import { Logger } from '@vitalets/logger';
import { SecurityTradingStatus } from 'tinkoff-invest-api/dist/generated/common.js';
import { Instrument, InstrumentIdType } from 'tinkoff-invest-api/dist/generated/instruments.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata.js';
import { CandlesReqParams } from 'tinkoff-invest-api/src/candles-loader/req';
import { RobotModule } from './utils/robot-module.js';
import { Robot } from './robot.js';

export class FigiInstrument extends RobotModule {
  candles: HistoricCandle[] = [];
  info?: Instrument;

  constructor(protected robot: Robot, public figi: string) {
    super(robot);
    this.logger = new Logger({ prefix: `[instrument_${figi}]:`, level: robot.logger.level });
  }

  /**
   * Загрузка данных об инструменте.
   */
  async loadInfo() {
    const { instrument } = await this.api.instruments.getInstrumentBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_FIGI,
      classCode: '',
      id: this.figi
    });
    this.info = instrument;
  }

  /**
   * Доступны ли торги по инструменту.
   */
  isTradingAvailable() {
    const status = this.info?.tradingStatus;
    const isAvailable = status === SecurityTradingStatus.SECURITY_TRADING_STATUS_NORMAL_TRADING;
    if (!isAvailable) this.logger.log(`Торги недоступны: ${status}`);
    return isAvailable;
  }

  /**
   * Загружаем свечи.
   */
  async loadCandles(req: Pick<CandlesReqParams, 'interval' | 'minCount'>) {
    this.logger.log(`Загружаю ${req.minCount} свечей для ${this.info?.ticker} ...`);
    const { candles } = await this.robot.candlesLoader.getCandles({ figi: this.figi, ...req });
    this.candles = candles;
    this.logger.log(`Свечи загружены: ${candles.length}, текущая цена: ${this.getCurrentPrice()}`);
  }

  /**
   * Текущая цена за 1 шт.
   */
  getCurrentPrice() {
    const close = this.candles[ this.candles.length - 1 ]?.close;
    return this.api.helpers.toNumber(close) || 0;
  }

  /**
   * Лотность.
   */
  getLotSize() {
    return this.info?.lot || 0;
  }
}
