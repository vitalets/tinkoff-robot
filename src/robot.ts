/**
 * Запуск робота.
 */
import 'dotenv/config';
import { RealAccount, SandboxAccount, TinkoffAccount, TinkoffInvestApi } from 'tinkoff-invest-api';
import { Helpers } from 'tinkoff-invest-api/dist/helpers.js';
import { Logger } from './logger.js';
import { runStrategy } from './strategy.js';
import { OrderDirection, OrderExecutionReportStatus, OrderState, OrderType } from 'tinkoff-invest-api/dist/generated/orders.js';
import { Config } from './config.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata';
import { PortfolioPosition } from 'tinkoff-invest-api/dist/generated/operations';
import { randomUUID } from 'crypto';
import { sleep } from './utils.js';

const { REAL_ACCOUNT_ID = '', SANDBOX_ACCOUNT_ID = '' } = process.env;

export class Robot {
  private account: TinkoffAccount;
  private candles: HistoricCandle[] = [];
  private positions: PortfolioPosition[] = [];
  private orders: OrderState[] = [];
  private logger: Logger;

  constructor(private api: TinkoffInvestApi, private config: Config) {
    this.logger = new Logger({ prefix: config.useRealAccount ? '[REAL]:' : '[sandbox]:' });
    this.account = config.useRealAccount
      ? new RealAccount(api, REAL_ACCOUNT_ID)
      : new SandboxAccount(api, SANDBOX_ACCOUNT_ID);
  }

  /**
   * Запуск робота в бесконечном цикле.
   */
  async run(intervalMinutes = 1) {
    while (true) {
      await this.tick();
      this.logger.log(`Жду ${intervalMinutes} мин...`);
      await sleep(intervalMinutes);
    }
  }

  /**
   * Запуск робота в бесконечном цикле.
   */
  async tick() {
    await this.loadCandles();
    const action = this.runStrategy();
    if (action === 'buy') await this.buy();
    if (action === 'sell') await this.sell();
  }

  /**
   * Загружаем свечи.
   * Возможно несколько запросов, чтобы набрать необходимое кол-во свечей.
   * todo: кешировать.
   */
  private async loadCandles() {
    this.logger.log(`Загружаю свежие свечи...`);
    const { figi, interval } = this.config;
    // const { from, to } = Helpers.fromTo(getTimeOffset());
    const { from, to } = Helpers.fromTo('-1d');
    const { candles } = await this.api.marketdata.getCandles({ figi, interval, from, to });
    this.candles = candles;
    this.logger.log(`Свечи загружены: ${candles.length}`);
  }

  private runStrategy() {
    const action = runStrategy(this.candles, this.config);
    this.logger.log(`Сигнал стратегии: ${action || 'ничего не делать'}`);
    return action;
  }

  /**
   * Загружаем существующие заявки
   */
  private async loadOrders() {
    const { orders } = await this.account.getOrders();
    this.orders = orders;
    this.logger.logOrders(orders);
  }

  /**
   * Загружаем текущие позиции.
   * Используем именно портфолио (а не getPositions), т.к. там есть цена покупки.
   */
  private async loadPositions() {
    const { positions } = await this.account.getPortfolio();
    this.positions = positions;
    this.logger.logPositions(positions);
  }

  private async buy() {
    await this.loadOrders();
    await this.cancelExistingOrder(OrderDirection.ORDER_DIRECTION_BUY);
    await this.loadPositions();
    const position = Boolean(this.getFigiPosition());
    if (position) {
      this.logger.log(`Позиция уже куплена. Ждем сигнала к продаже...`);
    } else {
      await this.postOrder(OrderDirection.ORDER_DIRECTION_BUY);
    }
  }

  private async sell() {
    await this.loadOrders();
    await this.cancelExistingOrder(OrderDirection.ORDER_DIRECTION_SELL);
    await this.loadPositions();
    const position = this.getFigiPosition();
    if (!position) {
      this.logger.log(`Позиции в портфеле нет. Ждем сигнала к покупке...`);
      return;
    }
    const profit = this.getCurrentProfit(position);
    // Если мы в плюсе или большом минусе, продаем по текущей цене
    if (profit > 0 || profit < this.config.stopLossPercent) {
      await this.postOrder(OrderDirection.ORDER_DIRECTION_SELL);
    }
    // todo: Если мы в небольшом минусе, то пробуем продать по цене, по которой будем в плюсе (если влезет в лимиты стакана)
  }

  private async postOrder(direction: OrderDirection) {
    const orderPrice = this.getCurrentPrice();
    const order = await this.account.postOrder({
      figi: this.config.figi,
      quantity: 1,
      direction,
      price: Helpers.toQuotation(orderPrice),
      orderType: OrderType.ORDER_TYPE_LIMIT,
      orderId: randomUUID(),
    });
    const action = direction === OrderDirection.ORDER_DIRECTION_BUY ? 'покупку' : 'продажу';
    this.logger.log(`Создана limit-заявка на ${action}: ${orderPrice}`);
    console.log(order); // check initial comission
  }

  private async cancelExistingOrder(direction: OrderDirection) {
    // Если есть текущая заявка по данному инструменту, отменяем - чтобы пересоздать с актуальной ценой
    // todo: на всякий случай отменять все заявки с данным figi?
    const existingOrder = this.orders.find(order => order.figi === this.config.figi && order.direction === direction);
    if (existingOrder?.executionReportStatus === OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_NEW) {
      this.logger.log(`Отмена предыдущей заявки: ${existingOrder.figi} ${Helpers.toNumber(existingOrder.initialSecurityPrice)}`);
      await this.account.cancelOrder(existingOrder.orderId);
    }
  }

  private getFigiPosition() {
    return this.positions.find(p => p.figi === this.config.figi);
  }

  private getCurrentPrice() {
    const close = this.candles[ this.candles.length - 1 ].close!;
    return this.api.helpers.toNumber(close);
  }

  private getCurrentProfit(position: PortfolioPosition) {
    const buyPrice = Helpers.toNumber(position.averagePositionPrice!);
    const profit = this.getCurrentPrice() * (1 - this.config.brokerFee) - buyPrice * (1 + this.config.brokerFee);
    return 100 * profit / buyPrice;
  }

  private getProfitablePrice(position: PortfolioPosition) {
    const buyPrice = Helpers.toNumber(position.averagePositionPrice!);
    return buyPrice * (1 + this.config.brokerFee) / (1 - this.config.brokerFee);
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
}


