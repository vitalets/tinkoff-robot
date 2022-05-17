/**
 * Базовый класс для дочерних модулей робота.
 */
import { Logger, LogLevel } from '@vitalets/logger';
import { Robot } from '../robot.js';

export abstract class RobotModule {
  logger: Logger;

  constructor(protected robot: Robot) {
    this.logger = new Logger({
      prefix: `[${this.constructor.name.toLowerCase()}]:`,
      level: this.robot.config.logLevel as LogLevel,
    });
  }

  protected get api() { return this.robot.api; }
  protected get account() { return this.robot.account; }
}
