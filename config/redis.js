const redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

let redisClient;

const initializeRedis = async () => {
  try {
    const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisURL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.warn('Redis server not available, using in-memory fallback');
          return undefined; // Don't retry, use fallback
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.warn('Redis retry time exhausted, using in-memory fallback');
          return undefined;
        }
        if (options.attempt > 3) {
          logger.warn('Redis max retry attempts reached, using in-memory fallback');
          return undefined;
        }
        return Math.min(options.attempt * 100, 1000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis client error, using in-memory fallback:', err.message);
    });

    redisClient.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    try {
      await redisClient.connect();
    } catch (error) {
      logger.warn('Redis connection failed, using in-memory fallback:', error.message);
      redisClient = null; // Set to null to indicate fallback mode
    }
    
  } catch (error) {
    logger.warn('Redis initialization failed, using in-memory fallback:', error.message);
    redisClient = null; // Set to null to indicate fallback mode
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    // Return a mock Redis client for fallback mode
    return {
      get: async (key) => null,
      set: async (key, value, options) => 'OK',
      del: async (key) => 1,
      exists: async (key) => 0,
      expire: async (key, seconds) => 1,
      ttl: async (key) => -1,
      keys: async (pattern) => [],
      flushall: async () => 'OK'
    };
  }
  return redisClient;
};

module.exports = { initializeRedis, getRedisClient };