module.exports = {
  apps: [{
    name: 'frontend-bsc',
    cwd: '/root/blockdag-escrow/live/bsc',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 3003',
    interpreter: '/usr/bin/node',
    env: {
      PORT: 3003,
      NODE_ENV: 'production',
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};