import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    /**
     * Main Redis connection used for caching and rate limiting
     */
    main: {
      host: env.get('REDIS_HOST', 'redis'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: 'nexus:',
      retryStrategy(times) {
        // Reconnect after delay, max 2 seconds
        return Math.min(times * 50, 2000)
      },
    },

    /**
     * Separate connection for rate limiter to avoid conflicts
     */
    limiter: {
      host: env.get('REDIS_HOST', 'redis'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: 1, // Use separate DB for rate limiting
      keyPrefix: 'limiter:',
      retryStrategy(times) {
        return Math.min(times * 50, 2000)
      },
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
