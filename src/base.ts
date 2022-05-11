/**
 * Базовый класс для модулей робота.
 */

import { Logger } from '@vitalets/logger';
import { Robot } from './index.js';

export abstract class RobotModule {
  protected logger = new Logger({ prefix: `[${this.constructor.name.toLowerCase()}]:` });

  constructor(protected robot: Robot) { }

  protected get api() { return this.robot.api; }
  protected get config() { return this.robot.config; }
  protected get account() { return this.robot.account; }
}
