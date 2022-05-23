import 'dotenv/config';
import { TinkoffInvestApi } from 'tinkoff-invest-api';

export const api = new TinkoffInvestApi({
  token: process.env.TINKOFF_API_TOKEN!,
  appName: 'vitalets/tinkoff-robot',
});

export const backtestApi = new TinkoffInvestApi({
  endpoint: 'localhost:8080',
  token: process.env.TINKOFF_API_TOKEN!,
  appName: 'vitalets/tinkoff-robot',
});
