module.exports = {
  apps: [
    {
      name: "iso8583-server",
      cwd: "./server",
      script: "pnpm",
      args: "dev",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "iso8583-web",
      cwd: "./web",
      script: "pnpm",
      args: "dev",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
