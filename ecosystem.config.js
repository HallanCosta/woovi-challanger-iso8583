module.exports = {
  apps: [
    {
      name: "iso8583-acquirer",
      cwd: "./acquirer-server",
      script: "pnpm",
      args: "run start",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "iso8583-brands",
      cwd: "./brands-server",
      script: "pnpm",
      args: "run start",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "iso8583-issuer",
      cwd: "./issuer-server",
      script: "pnpm",
      args: "run start",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "iso8583-web",
      cwd: "./web",
      script: "npx",
      args: "vite preview --mode production --host 0.0.0.0 --port 4174",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
