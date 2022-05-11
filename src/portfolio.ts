/**
 * Класс работы с позициями в портфеле.
 */

import { PortfolioResponse } from 'tinkoff-invest-api/dist/generated/operations.js';
import { RobotModule } from './base.js';

export class Portfolio extends RobotModule {
  private portfolio?: PortfolioResponse;
  private get positions() { return this.portfolio?.positions || []; }

  /**
   * Загружаем текущие позиции.
   * Используем именно портфолио (а не getPositions), т.к. там есть цена покупки.
   */
  async load() {
    this.portfolio = await this.account.getPortfolio();
    this.logPositions();
  }

  // private getFigiPosition() {
  //   return this.positions.find(p => p.figi === this.config.figi);
  // }

  // /**
  //  * Профит в % за 1 инструмент при продаже по текущей цене (с учетом комиссий).
  //  * Вычисляется относительно цены покупки.
  //  */
  // private getCurrentProfit(position: PortfolioPosition) {
  //   const buyPrice = Helpers.toNumber(position.averagePositionPrice!);
  //   const sellPrice = this.getCurrentPrice();
  //   const brokerFee = (buyPrice + sellPrice) * this.config.brokerFee / 100;
  //   const profit = sellPrice - buyPrice - brokerFee;
  //   return 100 * profit / buyPrice;
  // }

  private logPositions() {
    this.logger.log(`Позиции загружены: ${this.positions.length}`);
    this.positions.forEach(p => {
      const s = [
        ' '.repeat(4),
        p.figi,
        `(${p.instrumentType}, ${this.api.helpers.toNumber(p.quantity)})`,
        `${this.api.helpers.toNumber(p.averagePositionPrice)} -> ${this.api.helpers.toNumber(p.currentPrice)}`,
        `(${this.api.helpers.toNumber(p.expectedYield)} ${p.currentPrice?.currency})`,
      ].join(' ');
      this.logger.log(s);
    });
  }
}
