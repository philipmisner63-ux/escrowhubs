module.exports = {
  apps: [{
    name: 'frontend',
    cwd: '/root/blockdag-escrow/live/blockdag',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    interpreter: '/usr/bin/node',
    env: {
      PORT: 3000,
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