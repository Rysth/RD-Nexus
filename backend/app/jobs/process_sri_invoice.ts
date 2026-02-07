/**
 * Process SRI Invoice Job
 *
 * Background job to process an invoice through Ecuador's SRI electronic billing system.
 * This allows for async processing without blocking the API request.
 */

import { Job } from 'adonisjs-jobs'
import Invoice from '#models/invoice'
import SriService from '#services/sri_service'
import logger from '@adonisjs/core/services/logger'

interface ProcessSriInvoicePayload {
  invoiceId: number
  retryCount?: number
}

export default class ProcessSriInvoiceJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  /**
   * Queue name for this job
   */
  static queue = 'default'

  /**
   * Number of retry attempts
   */
  static retries = 3

  /**
   * Delay between retries (in seconds)
   */
  static retryDelay = 60

  /**
   * Job backoff strategy
   */
  static backoff = {
    type: 'exponential',
    delay: 30000, // 30 seconds base delay
  }

  /**
   * Handle job execution
   */
  async handle(payload: ProcessSriInvoicePayload) {
    const { invoiceId, retryCount = 0 } = payload

    logger.info(`[SRI Job] Processing invoice #${invoiceId} (attempt ${retryCount + 1})`)

    try {
      // Load invoice
      const invoice = await Invoice.query()
        .where('id', invoiceId)
        .preload('client')
        .preload('items')
        .first()

      if (!invoice) {
        logger.error(`[SRI Job] Invoice #${invoiceId} not found`)
        return
      }

      // Skip if already authorized
      if (invoice.sriStatus === 'authorized') {
        logger.info(`[SRI Job] Invoice #${invoiceId} already authorized, skipping`)
        return
      }

      // Initialize SRI service from business config
      const sriService = await SriService.fromBusiness()

      // Validate configuration
      const validation = sriService.validateConfig()
      if (!validation.valid) {
        logger.error(`[SRI Job] Invalid SRI configuration: ${validation.errors.join(', ')}`)
        return
      }

      // Process invoice through SRI
      const result = await sriService.processInvoice(invoice)

      if (result.success) {
        logger.info(`[SRI Job] Invoice #${invoiceId} successfully authorized. Access key: ${result.accessKey}`)
      } else if (result.status === 'pending') {
        logger.info(`[SRI Job] Invoice #${invoiceId} pending authorization. Will retry later.`)

        // Re-queue to check authorization status later
        if (retryCount < 5) {
          // @ts-ignore - dispatch is available at runtime
          await ProcessSriInvoiceJob.dispatch({
            invoiceId,
            retryCount: retryCount + 1,
          }, {
            delay: 120000, // Wait 2 minutes before checking again
          })
        }
      } else {
        logger.error(`[SRI Job] Invoice #${invoiceId} rejected. Messages: ${JSON.stringify(result.messages)}`)
      }
    } catch (error: any) {
      logger.error(`[SRI Job] Error processing invoice #${invoiceId}: ${error.message}`)
      throw error // Re-throw to trigger retry
    }
  }

  /**
   * This is an optional method that gets called when the retries have exceeded and is marked failed.
   */
  async rescue(payload: ProcessSriInvoicePayload) {
    const { invoiceId } = payload
    logger.error(`[SRI Job] Invoice #${invoiceId} failed after all retries. Manual intervention required.`)

    // Update invoice status to mark it as failed
    const invoice = await Invoice.find(invoiceId)
    if (invoice && invoice.sriStatus !== 'authorized') {
      invoice.sriStatus = 'rejected'
      await invoice.save()
    }
  }
}
