/**
 * Базовый класс для дочерних модулей робота.
 */
import { Logger, LogLevel } from '@vitalets/logger';
import { Robot } from './index.js';

export abstract class RobotModule {
  protected logger = new Logger({
    prefix: `[${this.constructor.name.toLowerCase()}]:`,
    level: this.config.logLevel as LogLevel,
  });

  constructor(protected robot: Robot) { }

  protected get api() { return this.robot.api; }
  protected get config() { return this.robot.config; }
  protected get account() { return this.robot.account; }
}
