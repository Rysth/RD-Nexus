import { Job } from 'adonisjs-jobs'
import { DateTime } from 'luxon'
import OtpCode from '#models/otp_code'

/**
 * OTP Cleanup Job
 * Removes expired OTP codes from the database to prevent accumulation
 * Similar to Rails OtpCleanupJob with Sidekiq
 */
export default class OtpCleanup extends Job {
  /**
   * Base-level options for the job
   * These can be overridden when dispatching
   */
  static get options() {
    return {
      queue: 'default',
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 5000,
      },
    }
  }

  /**
   * Handle the OTP cleanup job
   * Deletes all expired OTP codes and reschedules the job
   */
  async handle() {
    try {
      // Delete expired OTP codes (where expires_at is in the past)
      const expiredDeleted = await OtpCode.query()
        .where('expires_at', '<', DateTime.now().toSQL())
        .delete()

      // The delete method returns number of affected rows
      const deletedCount = Array.isArray(expiredDeleted) ? expiredDeleted.length : expiredDeleted
      this.logger.info(`[OTP Cleanup] Deleted ${deletedCount} expired OTP codes`)

      // Also delete used OTP codes older than 24 hours for cleanup
      const usedDeleted = await OtpCode.query()
        .whereNotNull('used_at')
        .where('used_at', '<', DateTime.now().minus({ hours: 24 }).toSQL())
        .delete()

      const deletedUsedCount = Array.isArray(usedDeleted) ? usedDeleted.length : usedDeleted
      if (deletedUsedCount > 0) {
        this.logger.info(`[OTP Cleanup] Deleted ${deletedUsedCount} used OTP codes older than 24 hours`)
      }

      // Reschedule the job to run again in 1 hour
      await OtpCleanup.dispatch({}, { delay: 60 * 60 * 1000 }) // 1 hour in milliseconds
      this.logger.info('[OTP Cleanup] Job rescheduled for 1 hour from now')
    } catch (error) {
      this.logger.error('[OTP Cleanup] Error cleaning up OTP codes:', error)
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error) {
    this.logger.error('[OTP Cleanup] Job failed after all retries:', error)
    // Optionally: send alert to monitoring system
  }
}