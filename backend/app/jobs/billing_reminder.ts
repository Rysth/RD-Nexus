import { Job } from 'adonisjs-jobs'
import { DateTime } from 'luxon'
import RecurringService from '#models/recurring_service'
import InvoiceService from '#services/invoice_service'
import SendBillingNotificationEmail from '#jobs/send_billing_notification_email'
import CacheService from '#services/cache_service'
import logger from '@adonisjs/core/services/logger'

/**
 * Billing Reminder Job
 * Runs daily to generate invoices for recurring services due today or within 3 days
 * Similar to Rails BillingReminderJob with Sidekiq
 */
export default class BillingReminder extends Job {
  /**
   * Base-level options for the job
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
   * Handle the billing reminder job
   * Finds active recurring services with next_billing_date = today
   * Generates invoices and sends notification emails
   */
  async handle() {
    const invoiceService = new InvoiceService()
    const today = DateTime.now().startOf('day')

    try {
      logger.info('[BillingReminder] Starting billing reminder job...')

      // Find all active recurring services with next_billing_date = today
      const servicesToBill = await RecurringService.query()
        .where('status', 'active')
        .where('next_billing_date', '<=', today.toSQLDate())
        .preload('project', (query) => query.preload('client'))

      logger.info(`[BillingReminder] Found ${servicesToBill.length} services to bill`)

      let invoicesGenerated = 0
      let errors = 0

      for (const service of servicesToBill) {
        try {
          // Generate invoice from recurring service
          const invoice = await invoiceService.createFromRecurringService(service.id)

          // Load relations for email
          await invoice.load('client')
          await invoice.load('project')
          await invoice.load('items')

          logger.info(
            `[BillingReminder] Generated invoice ${invoice.invoiceNumber} for service "${service.name}" (${service.project.name})`
          )

          // Dispatch email notification job
          await SendBillingNotificationEmail.dispatch({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: service.project.client.name,
            clientEmail: service.project.client.email,
            serviceName: service.name,
            projectName: service.project.name,
            total: Number(invoice.total),
            dueDate: invoice.dueDate.toISODate() || '',
          })

          invoicesGenerated++
        } catch (error) {
          errors++
          logger.error(
            `[BillingReminder] Failed to process service ${service.id} (${service.name}):`,
            error
          )
          // Continue with other services even if one fails
        }
      }

      logger.info(
        `[BillingReminder] Completed. Generated ${invoicesGenerated} invoices, ${errors} errors`
      )

      // Invalidate caches so new records are visible immediately
      if (invoicesGenerated > 0) {
        await CacheService.deleteMatched('invoices:*')
        await CacheService.invalidateRecurringServices()
      }

      // Reschedule the job to run again tomorrow at 8:00 AM (only when running in queue)
      if (this.logger) {
        const nextRun = this.calculateNextRunTime()
        await BillingReminder.dispatch({}, { delay: nextRun })
        logger.info(
          `[BillingReminder] Job rescheduled for ${DateTime.now().plus({ milliseconds: nextRun }).toISO()}`
        )
      }
    } catch (error) {
      logger.error('[BillingReminder] Critical error in billing reminder job:', error)
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Calculate milliseconds until next 8:00 AM
   */
  private calculateNextRunTime(): number {
    const now = DateTime.now()
    let nextRun = now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 })

    // If it's already past 8 AM today, schedule for tomorrow
    if (now >= nextRun) {
      nextRun = nextRun.plus({ days: 1 })
    }

    return nextRun.diff(now).milliseconds
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error) {
    logger.error('[BillingReminder] Job failed after all retries:', error)
    // Still reschedule for tomorrow even if this run failed
    const nextRun = this.calculateNextRunTime()
    await BillingReminder.dispatch({}, { delay: nextRun })
  }
}
