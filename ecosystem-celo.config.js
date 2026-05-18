module.exports = {
  apps: [{
    name: 'frontend-celo',
    cwd: '/root/blockdag-escrow/frontend-celo',
    // Celo uses next start (non-standalone) — requires node_modules symlink
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 3004',
    interpreter: '/usr/bin/node',
    env: {
      PORT: 3004,
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
