/**
 * Jobs Initialization
 * This file is responsible for initializing recurring jobs on server start
 */

import OtpCleanup from '#jobs/otp_cleanup'
import logger from '@adonisjs/core/services/logger'

/**
 * Schedule the OTP cleanup job to run periodically
 * Similar to Rails OtpCleanupJob that reschedules itself every hour
 */
export async function initializeRecurringJobs(): Promise<void> {
  try {
    // Dispatch the initial OTP cleanup job
    // It will reschedule itself after completion
    await OtpCleanup.dispatch({})
    logger.info('[Jobs] OTP cleanup job scheduled')
  } catch (error) {
    logger.error('[Jobs] Failed to schedule OTP cleanup job:', error)
  }
}
