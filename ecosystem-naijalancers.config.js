module.exports = {
  apps: [{
    name: 'frontend-naijalancers',
    cwd: '/root/blockdag-escrow/frontend-naijalancers',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 3005',
    interpreter: '/usr/bin/node',
    env: {
      PORT: 3005,
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
