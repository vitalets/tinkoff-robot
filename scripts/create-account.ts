/**
 * Создать счет в песочнице.
 * npx ts-node-esm scripts/create-account.ts
 */

import { Helpers } from 'tinkoff-invest-api';
import { api } from './init-api.js';

main();

async function main() {
  const { accountId } = await api.sandbox.openSandboxAccount({});
  const amount = Helpers.toMoneyValue(100_000, 'rub');
  await api.sandbox.sandboxPayIn({ accountId, amount });
  console.log(`Создан счет: ${accountId}, баланс: ${Helpers.toMoneyString(amount)}`);
}
