/**
 * Класс работы с заявками.
 */
import { randomUUID } from 'crypto';
import { Status, ClientError } from 'nice-grpc';
import {
  OrderDirection,
  OrderExecutionReportStatus,
  OrderState,
  OrderType,
  PostOrderRequest
} from 'tinkoff-invest-api/dist/generated/orders.js';
import { RobotModule } from '../utils/robot-module.js';

export type LimitOrderReq = Pick<PostOrderRequest, 'figi' | 'direction' | 'quantity' | 'price'>;

export class Orders extends RobotModule {
  items: OrderState[] = [];

  private get dryRunStr() {
    return this.robot.config.dryRun ? 'DRY_RUN ' : '';
  }

  /**
   * Загружаем существующие заявки
   */
  async load() {
    const { orders } = await this.account.getOrders();
    this.items = orders;
    this.logItems();
  }

  /**
   * Создаем новую лимит-заявку
   */
  async postLimitOrder({ figi, direction, quantity, price }: LimitOrderReq) {
    const order = this.robot.config.dryRun ? null : await this.account.postOrder({
      figi,
      quantity,
      direction,
      price,
      orderType: OrderType.ORDER_TYPE_LIMIT,
      orderId: randomUUID(),
    });
    const action = direction === OrderDirection.ORDER_DIRECTION_BUY ? 'покупку' : 'продажу';
    const priceNum = this.api.helpers.toNumber(price);
    this.logger.warn(`${this.dryRunStr}Создана заявка на ${action}: лотов ${quantity}, цена ${priceNum}`);
    return order;
  }

  /**
   * Отменяем все существующие заявки для данного figi.
   */
  async cancelExistingOrders(figi: string) {
    const existingOrders = this.items.filter(order => order.figi === figi);
    const tasks = existingOrders.map(async order => {
      const prevPrice = this.api.helpers.toNumber(order.initialSecurityPrice);
      const { dryRun } = this.robot.config;
      this.logger.warn(`${this.dryRunStr}Отмена предыдущей заявки ${order.orderId}, цена ${prevPrice}`);
      try {
        if (!dryRun) await this.account.cancelOrder(order.orderId);
      } catch (e) {
        if (e instanceof ClientError && e.code === Status.NOT_FOUND) {
          this.logger.warn(e.message);
        } else {
          throw e;
        }
      }
    });
    await Promise.all(tasks);
  }

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
