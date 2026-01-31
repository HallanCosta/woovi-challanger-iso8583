const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apps: [
    {
      name: "iso8583-web",
      script: "pnpm",
      args: "run start",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        VITE_NODE_ENV: process.env.VITE_NODE_ENV,
        VITE_BASE_URL_ACQUIRER_API: process.env.VITE_BASE_URL_ACQUIRER_API,
        VITE_BASE_URL_ISSUER_API: process.env.VITE_BASE_URL_ISSUER_API,
        VITE_BRAND_PIX_ENABLED: process.env.VITE_BRAND_PIX_ENABLED,
        VITE_BRAND_VISA_ENABLED: process.env.VITE_BRAND_VISA_ENABLED,
        VITE_BRAND_MASTERCARD_ENABLED: process.env.VITE_BRAND_MASTERCARD_ENABLED,
      },
    },
  ],
};
