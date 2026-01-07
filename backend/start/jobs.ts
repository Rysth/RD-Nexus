/**
 * Jobs Initialization
 * This file is responsible for initializing recurring jobs on server start
 */

import OtpCleanup from '#jobs/otp_cleanup'
import BillingReminder from '#jobs/billing_reminder'
import logger from '@adonisjs/core/services/logger'

/**
 * Schedule recurring jobs on server start
 * Similar to Rails initializers with Sidekiq
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

  try {
    // Dispatch the billing reminder job
    // Runs daily at 8:00 AM to generate invoices for recurring services
    await BillingReminder.dispatch({})
    logger.info('[Jobs] Billing reminder job scheduled')
  } catch (error) {
    logger.error('[Jobs] Failed to schedule billing reminder job:', error)
  }
}
