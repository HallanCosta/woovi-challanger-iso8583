const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apps: [
    {
      name: "iso8583-brands",
      script: "./dist/main.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: process.env.NODE_ENV,
        HOST: process.env.HOST,
        SERVER_TCP_PORT: process.env.SERVER_TCP_PORT,
        ACQUIRER_SERVER_PORT: process.env.ACQUIRER_SERVER_PORT,
        ISSUER_SERVER_PORT: process.env.ISSUER_SERVER_PORT,
        ISSUER_SERVER_HOST: process.env.ISSUER_SERVER_HOST,
      },
    },
  ],
};
