module.exports = {
  apps: [{
    name: 'frontend-polygon',
    cwd: '/root/blockdag-escrow/live/polygon',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 3002',
    interpreter: '/usr/bin/node',
    env: {
      PORT: 3002,
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