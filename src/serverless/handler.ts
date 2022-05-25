/**
 * Запуск из серверлесс функции.
 */
import { Handler, TimerMessage, fixConsoleForLogging } from 'yandex-cloud-fn';
import { TinkoffInvestApi } from 'tinkoff-invest-api';
import { Robot, RobotConfig } from '../robot.js';
import { config } from '../config.js';

fixConsoleForLogging();

const api = new TinkoffInvestApi({
  token: process.env.TINKOFF_API_TOKEN!,
  appName:' vitalets/tinkoff-robot',
});

const configOverwrite: Partial<RobotConfig> = {
  useRealAccount: true,
  dryRun: true,
};

export const handler: Handler<TimerMessage> = async event => {
  try {
    const finalConfig = { ...config, ...configOverwrite };
    const robot = new Robot(api, finalConfig);
    await robot.runOnce();
  } catch (e) {
    throw attachEventToError(e, event);
  }
};

function attachEventToError(error: Error, event: TimerMessage) {
  error.stack += ` EVENT: ${JSON.stringify(event)}`;
  return error;
}
