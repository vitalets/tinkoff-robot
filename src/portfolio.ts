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

  getPosition() {
    return this.positions.find(p => p.figi === this.config.figi);
  }

  getBalance() {
    return this.api.helpers.toNumber(this.portfolio?.totalAmountCurrencies) || 0;
  }

  private logPositions() {
    this.logger.log(`Позиции загружены: ${this.positions.length}`);
    this.positions.forEach(p => {
      const s = [
        ' '.repeat(4),
        p.figi,
        `${this.api.helpers.toNumber(p.quantity)} x ${this.api.helpers.toNumber(p.averagePositionPrice)}`,
        `(${this.api.helpers.toNumber(p.expectedYield)} ${p.currentPrice?.currency})`,
      ].join(' ');
      this.logger.log(s);
    });
  }
}
