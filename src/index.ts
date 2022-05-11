/**
 * Запуск робота.
 */
import 'dotenv/config';
import { RealAccount, SandboxAccount, TinkoffAccount, TinkoffInvestApi } from 'tinkoff-invest-api';
import { Helpers } from 'tinkoff-invest-api/dist/helpers.js';
import { Logger } from '@vitalets/logger';
import { Strategy } from './strategy.js';
import { OrderDirection, OrderExecutionReportStatus, OrderState, OrderType } from 'tinkoff-invest-api/dist/generated/orders.js';
import { Config } from './config.js';
import { HistoricCandle } from 'tinkoff-invest-api/dist/generated/marketdata';
import { PortfolioPosition, PortfolioResponse } from 'tinkoff-invest-api/dist/generated/operations';
import { randomUUID } from 'crypto';
import { sleep } from './utils.js';
import { Instrument, InstrumentIdType } from 'tinkoff-invest-api/dist/generated/instruments.js';
import { SecurityTradingStatus } from 'tinkoff-invest-api/dist/generated/common.js';
import { Market } from './market.js';
import { Orders } from './orders.js';
import { Portfolio } from './portfolio.js';

const { REAL_ACCOUNT_ID = '', SANDBOX_ACCOUNT_ID = '' } = process.env;

export class Robot {
  public account: TinkoffAccount;
  protected logger = new Logger({ prefix: '[robot]:' });
  protected market = new Market(this);
  protected strategy = new Strategy(this);
  protected orders = new Orders(this);
  protected protfolio = new Portfolio(this);

  constructor(public api: TinkoffInvestApi, public config: Config) {
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
   * Разовый запуск робота на текущих данных.
   */
  async tick() {
    await this.market.loadInstrumentState();
    if (!this.market.isTradingAvailable()) return;
    await this.market.loadCandles();
    const action = this.runStrategy();
    if (action) {
      await this.orders.load();
      await this.protfolio.load();
    }
    // if (action === 'buy') await this.buy();
    // if (action === 'sell') await this.sell();
  }

  private runStrategy() {
    return this.strategy.run(this.market.candles);
  }
  // private async buy() {
  //   await this.loadOrders();
  //   await this.cancelExistingOrder(OrderDirection.ORDER_DIRECTION_BUY);
  //   await this.loadPortfolio();
  //   const position = this.getFigiPosition();
  //   const lots = Helpers.toNumber(position?.quantityLots);
  //   if (lots) {
  //     this.logger.log(`Позиция уже куплена, лотов: ${lots}. Ждем сигнала к продаже...`);
  //   } else {
  //     await this.postOrder(OrderDirection.ORDER_DIRECTION_BUY);
  //   }
  // }

  // private async sell() {
  //   await this.loadOrders();
  //   await this.cancelExistingOrder(OrderDirection.ORDER_DIRECTION_SELL);
  //   await this.loadPortfolio();
  //   const position = this.getFigiPosition();
  //   const lots = Helpers.toNumber(position?.quantityLots);
  //   if (!position || !lots) {
  //     this.logger.log(`Позиции в портфеле нет. Ждем сигнала к покупке...`);
  //     return;
  //   }
  //   const profit = this.getCurrentProfit(position);
  //   // Если мы в плюсе либо большом минусе, продаем по текущей цене
  //   if (profit > 0 || profit < this.config.stopLossPercent) {
  //     await this.postOrder(OrderDirection.ORDER_DIRECTION_SELL);
  //   }
  //   // todo: Если мы в небольшом минусе, то пробуем продать по цене, по которой будем в плюсе (если влезет в лимиты стакана)
  // }
}


