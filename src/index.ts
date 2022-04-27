import 'dotenv/config';
import { TinkoffInvestApi } from 'tinkoff-invest-api';

// создать клиента с заданным токеном
const api = new TinkoffInvestApi({ token: process.env.TINKOFF_API_TOKEN! });

main();

async function main() {
  const { accounts } = await api.users.getAccounts({});
  console.log(accounts);
}

