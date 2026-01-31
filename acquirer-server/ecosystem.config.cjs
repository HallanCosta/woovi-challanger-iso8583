const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  apps: [
    {
      name: "iso8583-acquirer",
      script: "./dist/main.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: process.env.NODE_ENV,
        DEBUG: process.env.DEBUG,
        HOST: process.env.HOST,
        SERVER_TCP_PORT: process.env.SERVER_TCP_PORT,
        SERVER_HTTP_PORT: process.env.SERVER_HTTP_PORT,
        BRANDS_SERVER_PORT: process.env.BRANDS_SERVER_PORT,
        BRANDS_SERVER_HOST: process.env.BRANDS_SERVER_HOST,
      },
    },
  ],
};
