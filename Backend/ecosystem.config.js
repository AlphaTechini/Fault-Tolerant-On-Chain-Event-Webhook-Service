module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/run-api.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'listener',
      script: 'dist/run-listener.js',
      instances: 1, // Singleton, we only want one listener per chain to avoid duplicating queued events
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'worker',
      script: 'dist/run-worker.js',
      instances: 4, // Horizontal scaling - 4 workers to handle webhook deliveries faster
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
};
