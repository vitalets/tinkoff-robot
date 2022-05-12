/**
 * Входная точка для торгового робота на Тинькофф АПИ.
 */
/* eslint-disable max-statements, complexity */
import 'dotenv/config';
import { RealAccount, SandboxAccount, TinkoffAccount, TinkoffInvestApi } from 'tinkoff-invest-api';
import { Helpers } from 'tinkoff-invest-api/dist/helpers.js';
import { Logger } from '@vitalets/logger';
import { Strategy } from './strategy.js';
import { OrderDirection } from 'tinkoff-invest-api/dist/generated/orders.js';
import { Config } from './config.js';
import { PortfolioPosition } from 'tinkoff-invest-api/dist/generated/operations';
import { Market } from './market.js';
import { Orders } from './orders.js';
import { Portfolio } from './portfolio.js';

const { REAL_ACCOUNT_ID = '', SANDBOX_ACCOUNT_ID = '' } = process.env;

export class Robot {
  account: TinkoffAccount;
  market = new Market(this);
  strategy = new Strategy(this);
  orders = new Orders(this);
  protfolio = new Portfolio(this);

  private logger = new Logger({ prefix: '[robot]:' });

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
    this.logger.log(`Запуск робота (${this.config.useRealAccount ? 'боевой счет' : 'песочница'})`);
    await this.market.loadInstrumentState();
    if (!this.market.isTradingAvailable()) return;
    await this.market.loadCandles();
    const action = this.strategy.run(this.market.candles);
    if (action) {
      await this.orders.load();
      await this.orders.cancelExistingOrders();
      await this.protfolio.load();
      const position = this.protfolio.getPosition();
      if (action === 'buy') await this.buy(position);
      if (action === 'sell') await this.sell(position);
    }
  }

  private async buy(position?: PortfolioPosition) {
    const existingLots = this.api.helpers.toNumber(position?.quantityLots) || 0;
    if (existingLots > 0) {
      this.logger.warn(`Позиция уже в портфеле, лотов: ${existingLots}. Ждем сигнала к продаже...`);
      return;
    }

    const currentPrice = this.market.getCurrentPrice();
    const lotSize = this.market.getLotSize();
    const orderPrice = currentPrice * this.config.orderLots * lotSize;
    const balance = this.protfolio.getBalance();
    if (orderPrice > balance) {
      this.logger.warn(`Недостаточно средств для покупки: ${orderPrice} > ${balance}`);
      return;
    }

    await this.orders.postOrder({
      direction: OrderDirection.ORDER_DIRECTION_BUY,
      quantity: this.config.orderLots,
      price: this.api.helpers.toQuotation(currentPrice),
    });
  }

  private async sell(position?: PortfolioPosition) {
    const existingLots = this.api.helpers.toNumber(position?.quantityLots) || 0;
    if (!position || existingLots === 0) {
      this.logger.warn(`Позиции в портфеле нет. Ждем сигнала к покупке...`);
      return;
    }

    const currentPrice = this.market.getCurrentPrice();
    const profit = this.calcCurrentProfit(position, currentPrice);
    const isStopLoss = profit < -this.config.stopLossPercent;
    const profitMsg = `Расчетная маржа: ${profit > 0 ? '+' : ''}${profit.toFixed(2)}%`;

    // Если мы в плюсе, либо в большом минусе, продаем по текущей цене
    if (profit > 0 || isStopLoss) {
      this.logger.warn(`${profitMsg}, продаем!`);
      await this.orders.postOrder({
        direction: OrderDirection.ORDER_DIRECTION_SELL,
        quantity: existingLots,
        price: this.api.helpers.toQuotation(currentPrice),
      });
    } else {
      this.logger.warn(`${profitMsg}, пока держим`);
    }

    // todo: Если мы в небольшом минусе, то пробуем продать по цене,
    // по которой будем в плюсе (если влезет в лимиты стакана)
  }

  /**
   * Расчет профита в % за 1 инструмент при продаже по текущей цене (с учетом комиссий).
   * Вычисляется относительно цены покупки.
   */
  private calcCurrentProfit(position: PortfolioPosition, currentPrice: number) {
    const buyPrice = Helpers.toNumber(position.averagePositionPrice!);
    const comission = (buyPrice + currentPrice) * this.config.brokerFee / 100;
    const profit = currentPrice - buyPrice - comission;
    return 100 * profit / buyPrice;
  }
}

async function sleep(minutes: number) {
  return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}
