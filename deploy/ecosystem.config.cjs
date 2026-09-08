module.exports = {
  apps: [
    {
      name: "cstmr-portal",
      cwd: "/var/www/cstmr_portal",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};