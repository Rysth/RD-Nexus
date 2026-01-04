import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'
import type { InferLimiters } from '@adonisjs/limiter/types'

const limiterConfig = defineConfig({
  /**
   * Default store to use for rate limiting.
   * Uses Redis in production for distributed rate limiting across multiple instances.
   * Falls back to memory in development/test for simplicity.
   */
  default: env.get('NODE_ENV') === 'production' ? 'redis' : 'redis',

  stores: {
    /**
     * Memory store - fast and suitable for single-instance deployments.
     * Good for testing or when Redis is not available.
     */
    memory: stores.memory({}),

    /**
     * Redis store - distributed rate limiting for multi-instance deployments.
     * Uses the 'limiter' Redis connection defined in config/redis.ts
     */
    redis: stores.redis({
      connectionName: 'limiter',
      rejectIfRedisNotReady: false,
    }),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
