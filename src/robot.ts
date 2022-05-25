/**
 * Входная точка для торгового робота.
 * Робот запускает параллельно несколько стратегий, переданных в конфиге.
 */
import { CandlesLoader, RealAccount, SandboxAccount, TinkoffAccount, TinkoffInvestApi } from 'tinkoff-invest-api';
import { Logger, LogLevel } from '@vitalets/logger';
import { Strategy, StrategyConfig } from './strategy.js';
import { Orders } from './account/orders.js';
import { Portfolio } from './account/portfolio.js';

const { REAL_ACCOUNT_ID = '', SANDBOX_ACCOUNT_ID = '' } = process.env;

export interface RobotConfig {
  /** Используем реальный счет или песочницу */
  useRealAccount: boolean,
  /** Запуск без создания заявок */
  dryRun?: boolean;
  /** Директория для кеширования свечей */
  cacheDir?: string,
  /** Уровень логирования */
  logLevel?: string,
  /** Используемые стратегии */
  strategies: StrategyConfig[],
}

const defaults: Pick<RobotConfig, 'dryRun' | 'cacheDir' | 'logLevel'> = {
  dryRun: false,
  cacheDir: '.cache',
  logLevel: 'info',
};

export class Robot {
  config: RobotConfig;
  account: TinkoffAccount;
  candlesLoader: CandlesLoader;
  orders: Orders;
  portfolio: Portfolio;
  strategies: Strategy[];

  logger: Logger;

  constructor(public api: TinkoffInvestApi, config: RobotConfig) {
    this.config = Object.assign({}, defaults, config);
    this.logger = new Logger({ prefix: '[robot]:', level: this.config.logLevel as LogLevel });
    this.account = config.useRealAccount
      ? new RealAccount(api, REAL_ACCOUNT_ID)
      : new SandboxAccount(api, SANDBOX_ACCOUNT_ID);
    this.candlesLoader = new CandlesLoader(api, { cacheDir: this.config.cacheDir });
    this.orders = new Orders(this);
    this.portfolio = new Portfolio(this);
    this.strategies = this.config.strategies.map(strategyConfig => new Strategy(this, strategyConfig));
  }

  /**
   * Разовый запуск робота на текущих данных.
   * Подходит для запуска по расписанию.
   */
  async runOnce() {
    this.logger.log(`Вызов робота (${this.config.useRealAccount ? 'боевой счет' : 'песочница'})`);
    await this.portfolio.load();
    await this.orders.load();
    await this.runStrategies();
    this.logger.log(`Вызов робота завершен`);
  }

  // todo: Запуск робота в режиме стрима.
  // async runStream(intervalMinutes = 1) {
  // - take figi from strategies
  // - load candles for all figi
  // - watch prices for all figi
  // }

  private async runStrategies() {
    const tasks = this.strategies.map(strategy => strategy.run());
    await Promise.all(tasks);
  }
}
