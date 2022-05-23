import 'dotenv/config';
import { TinkoffInvestApi } from 'tinkoff-invest-api';

const token = process.env.TINKOFF_API_TOKEN;
const appName = 'vitalets/tinkoff-robot';

if (!token) throw new Error(`Не указан токен.`);

export const api = new TinkoffInvestApi({
  token,
  appName,
});

export const backtestApi = new TinkoffInvestApi({
  token,
  appName,
  endpoint: 'localhost:8080',
});
