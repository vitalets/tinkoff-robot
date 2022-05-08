import { Logger as BaseLogger } from '@vitalets/logger';
import { PortfolioPosition } from 'tinkoff-invest-api/dist/generated/operations.js';
import { OrderDirection, OrderExecutionReportStatus, OrderState } from 'tinkoff-invest-api/dist/generated/orders.js';
import { Helpers } from 'tinkoff-invest-api/dist/helpers.js';

export class Logger extends BaseLogger {
  logPositions(positions: PortfolioPosition[]) {
    this.log(`Позиции загружены: ${positions.length}`);
    positions.forEach(p => {
      const s = [
        ' '.repeat(4),
        p.figi,
        `(${p.instrumentType}, ${Helpers.toNumber(p.quantity)})`,
        `${Helpers.toNumber(p.averagePositionPrice)} -> ${Helpers.toNumber(p.currentPrice)}`,
        `(${Helpers.toNumber(p.expectedYield)} ${p.currentPrice?.currency})`,
      ].join(' ');
      this.log(s);
    });
  }

  logOrders(orders: OrderState[]) {
    this.log(`Заявки загружены: ${orders.length}`);
    orders.forEach(item => {
      const s = [
        ' '.repeat(4),
        formatOrderStatus(item.executionReportStatus),
        item.direction === OrderDirection.ORDER_DIRECTION_BUY ? 'покупка' : 'продажа',
        item.lotsRequested,
        Helpers.toNumber(item.initialOrderPrice),
        item.initialOrderPrice?.currency,
        item.figi,
      ].join(' ');
      this.log(s);
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
