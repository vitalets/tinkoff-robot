/**
 * Класс работы с заявками.
 */

import { OrderDirection, OrderExecutionReportStatus, OrderState } from 'tinkoff-invest-api/dist/generated/orders.js';
import { RobotModule } from './base.js';

export class Orders extends RobotModule {
  items: OrderState[] = [];

  /**
   * Загружаем существующие заявки
   */
  async load() {
    const { orders } = await this.account.getOrders();
    this.items = orders;
    this.logItems();
  }

  // async postOrder(direction: OrderDirection) {
  //   const currentPrice = this.getCurrentPrice();
  //   const lots = this.config.orderLots;

  //   if (direction === OrderDirection.ORDER_DIRECTION_BUY) {
  //     const orderPrice = currentPrice * lots * (this.instrument?.lot || 0);
  //     const balance = Helpers.toNumber(this.portfolio?.totalAmountCurrencies) || 0;
  //     if (orderPrice > balance) {
  //       this.logger.log(`Недостаточно средств для покупки: ${orderPrice} > ${balance}`);
  //       return;
  //     }
  //   }

  //   const order = await this.account.postOrder({
  //     figi: this.config.figi,
  //     quantity: 1,
  //     direction,
  //     price: Helpers.toQuotation(currentPrice),
  //     orderType: OrderType.ORDER_TYPE_LIMIT,
  //     orderId: randomUUID(),
  //   });
  //   const action = direction === OrderDirection.ORDER_DIRECTION_BUY ? 'покупку' : 'продажу';
  //   this.logger.log(`Создана заявка на ${action}: ${currentPrice}`);
  //   console.log(order); // check initial comission
  // }

  // async cancelExistingOrder(direction: OrderDirection) {
  //   // Если есть текущая заявка по данному инструменту, отменяем - чтобы пересоздать с актуальной ценой
  //   // todo: на всякий случай отменять все заявки с данным figi?
  //   const existingOrder = this.orders.find(order => order.figi === this.config.figi && order.direction === direction);
  //   if (existingOrder?.executionReportStatus === OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_NEW) {
  //     this.logger.log(`Отмена предыдущей заявки: ${existingOrder.figi} ${Helpers.toNumber(existingOrder.initialSecurityPrice)}`);
  //     await this.account.cancelOrder(existingOrder.orderId);
  //   }
  // }

  private logItems() {
    this.logger.log(`Заявки загружены: ${this.items.length}`);
    this.items.forEach(item => {
      const s = [
        ' '.repeat(4),
        formatOrderStatus(item.executionReportStatus),
        item.direction === OrderDirection.ORDER_DIRECTION_BUY ? 'покупка' : 'продажа',
        item.lotsRequested,
        this.api.helpers.toMoneyString(item.initialOrderPrice),
        item.figi,
      ].join(' ');
      this.logger.log(s);
    });
  }
}

function formatOrderStatus(status: OrderExecutionReportStatus) {
  switch (status) {
    case OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_NEW: return 'Новая';
    case OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_FILL: return 'Исполнена';
    case OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_PARTIALLYFILL: return 'Частично исполнена';
    case OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_REJECTED: return 'Отклонена';
    case OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_CANCELLED: return 'Отменена пользователем';
    default: return `Неизвестный статус ${status}`;
  }
}
