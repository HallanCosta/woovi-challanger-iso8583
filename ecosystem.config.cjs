module.exports = {
  apps: [
    {
      name: "iso8583-web",
      cwd: "./",
      script: "pnpm",
      args: "preview --host 0.0.0.0 --port 4174 --strictPort",
      env: { NODE_ENV: "production" },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "iso8583-server",
      cwd: "./",
      script: "pnpm",
      args: "dev",
      env: { NODE_ENV: "production" },
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
}