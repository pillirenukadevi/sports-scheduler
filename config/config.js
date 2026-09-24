require('dotenv').config();

const devConfig = process.env.DATABASE_URL
  ? {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: (process.env.DB_SSL === 'true' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')))
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        : {},
      logging: false
    }
  : {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || null,
      database: process.env.DB_NAME || 'sports_scheduler_dev',
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    };

module.exports = {
  development: devConfig,
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_TEST_NAME || 'sports_scheduler_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};

