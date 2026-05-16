module.exports = {
  apps: [{
    name: 'frontend-base',
    cwd: '/root/blockdag-escrow/live/base',
    script: 'server.js',
    env: {
      PORT: 3001,
      NODE_ENV: 'production',
    },
    instances: 1,
    exec_mode: 'fork',
    // PM2 reload preserves connections during code swap
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
