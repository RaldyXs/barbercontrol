module.exports = {
  apps: [
    {
      name: 'barbercontrol-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        SYNC_UPSTREAM: 'https://barbercontrol-59hb.onrender.com',
        SYNC_INTERVAL_SEC: 60,
      },
    },
  ],
};
