const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, './.env')));

module.exports = {
  useCliConfig: true,
  functionName: 'tinkoff-robot',
  deploy: {
    files: [ 'package*.json', 'dist/**' ],
    handler: 'dist/serverless/cjs/index.handler',
    runtime: 'nodejs16',
    timeout: 5,
    memory: 128,
    account: 'tinkoff-robot-sa',
    environment: {
      NODE_ENV: 'production',
      TINKOFF_API_TOKEN: env.TINKOFF_API_TOKEN,
      REAL_ACCOUNT_ID: env.REAL_ACCOUNT_ID,
    },
  },
};
