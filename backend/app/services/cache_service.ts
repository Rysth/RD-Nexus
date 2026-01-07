/*
|--------------------------------------------------------------------------
| Cache Service
|--------------------------------------------------------------------------
|
| A simple caching service built on top of Redis for caching database queries
| and other expensive operations. Similar to Rails.cache functionality.
|
*/

import redis from '@adonisjs/redis/services/main'
import logger from '@adonisjs/core/services/logger'

export default class CacheService {
  /**
   * Default cache TTL in seconds (5 minutes)
   */
  private static DEFAULT_TTL = 300

  /**
   * Fetch a value from cache or execute the callback and cache the result
   * Similar to Rails.cache.fetch
   */
  static async fetch<T>(
    key: string,
    callback: () => Promise<T>,
    ttlSeconds: number = this.DEFAULT_TTL
  ): Promise<T> {
    try {
      const cached = await redis.get(key)
      if (cached) {
          logger.debug({ key }, 'Cache hit')
        return JSON.parse(cached) as T
      }
      logger.debug({ key }, 'Cache miss')
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache read error, falling back to callback')
    }

    // Execute callback to get fresh data
    const result = await callback()

    // Cache the result
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(result))
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache write error')
    }

    return result
  }

  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached) as T
      }
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache get error')
    }
    return null
  }

  /**
   * Set a value in cache
   */
  static async set(key: string, value: unknown, ttlSeconds: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache set error')
    }
  }

  /**
   * Delete a specific key from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache delete error')
    }
  }

  /**
   * Delete all keys matching a pattern
   * Similar to Rails.cache.delete_matched
   * 
   * Note: redis.keys() does NOT apply keyPrefix automatically,
   * so we must prepend it manually. The del() call receives
   * full key names from keys(), so we strip the prefix before deleting.
   */
  static async deleteMatched(pattern: string): Promise<void> {
    try {
      // keyPrefix is 'nexus:' - keys() needs the full pattern
      const fullPattern = `nexus:${pattern}`
      const keys = await redis.keys(fullPattern)
      logger.info({ pattern: fullPattern, count: keys.length }, 'Cache keys deleteMatched')
      if (keys.length > 0) {
        // del() DOES apply keyPrefix, so we must strip it from the keys
        const strippedKeys = keys.map((k) => k.replace(/^nexus:/, ''))
        await redis.del(...strippedKeys)
      }
    } catch (error) {
      logger.warn({ err: error, pattern }, 'Cache deleteMatched error')
    }
  }

  /**
   * Invalidate user-related caches
   * Call this after create, update, or delete operations
   */
  static async invalidateUsers(userId?: number): Promise<void> {
    // Invalidate all user list caches
    await this.deleteMatched('users:index:*')
    logger.info({ userId }, 'User caches invalidated')
    
    // If a specific user ID is provided, also invalidate that user's cache
    if (userId) {
      await this.deleteMatched(`user:${userId}:*`)
    }
  }

  /**
   * Invalidate business-related caches
   */
  static async invalidateBusiness(businessId?: number): Promise<void> {
    await this.deleteMatched('business:*')
    if (businessId) {
      await this.delete(`business:${businessId}`)
    }
  }

  /**
   * Invalidate client-related caches
   */
  static async invalidateClients(clientId?: number): Promise<void> {
    await this.deleteMatched('clients:index:*')
    if (clientId) {
      await this.deleteMatched(`client:${clientId}:*`)
      await this.deleteMatched(`client:${clientId}:projects:*`)
    }
  }

  /**
   * Invalidate project-related caches
   */
  static async invalidateProjects(projectId?: number, clientId?: number): Promise<void> {
    await this.deleteMatched('projects:index:*')

    if (projectId) {
      await this.deleteMatched(`project:${projectId}:*`)
    }

    if (clientId) {
      await this.deleteMatched(`client:${clientId}:projects:*`)
      await this.deleteMatched(`client:${clientId}:show`)
    }
  }

  /**
   * Invalidate recurring services caches
   */
  static async invalidateRecurringServices(projectId?: number): Promise<void> {
    await this.deleteMatched('recurring_services:*')
    if (projectId) {
      await this.deleteMatched(`project:${projectId}:recurring_services:*`)
    }
  }
}
