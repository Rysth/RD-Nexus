import { Job } from 'adonisjs-jobs'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

interface SendBillingNotificationPayload {
  invoiceId: number
  invoiceNumber: string
  clientName: string
  clientEmail: string | null
  serviceName: string
  projectName: string
  total: number
  dueDate: string
}

/**
 * SendBillingNotificationEmail Job
 * Sends billing notification emails for automatically generated invoices
 * Falls back to admin email (johnpalacios.t@gmail.com) if client has no email
 */
export default class SendBillingNotificationEmail extends Job {
  /**
   * Base-level options for the job
   */
  static get options() {
    return {
      queue: 'mail',
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
    }
  }

  /**
   * Fallback email when client doesn't have one
   */
  private static readonly FALLBACK_EMAIL = 'johnpalacios.t@gmail.com'

  /**
   * Handle the send billing notification email job
   */
  async handle(payload: SendBillingNotificationPayload) {
    const {
      invoiceNumber,
      clientName,
      clientEmail,
      serviceName,
      projectName,
      total,
      dueDate,
    } = payload

    // For now, always send to admin as a reminder (skip client emails)
    // TODO: Enable client emails when ready for production
    const recipientEmail = SendBillingNotificationEmail.FALLBACK_EMAIL
    const isInternalNotification = true

    try {
      await mail.send((message) => {
        message
          .to(recipientEmail)
          .subject(
            isInternalNotification
              ? `[INTERNO] Nueva factura generada - ${invoiceNumber}`
              : `Nueva factura generada - ${invoiceNumber}`
          )
          .htmlView('emails/billing_notification', {
            clientName,
            clientEmail,
            serviceName,
            projectName,
            invoiceNumber,
            total: this.formatCurrency(total),
            dueDate: this.formatDate(dueDate),
            isInternalNotification,
            appUrl: env.get('APP_URL', 'http://localhost:5173'),
          })
      })

      if (isInternalNotification) {
        logger.info(
          `[SendBillingNotification] Internal billing reminder sent to ${recipientEmail} for invoice ${invoiceNumber} (client ${clientName})`
        )
      } else {
        logger.info(
          `[SendBillingNotification] Billing notification sent to ${recipientEmail} for invoice ${invoiceNumber}`
        )
      }
    } catch (error) {
      logger.error(
        `[SendBillingNotification] Failed to send email for invoice ${invoiceNumber}:`,
        error
      )
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  /**
   * Format date for display
   */
  private formatDate(isoDate: string): string {
    try {
      const date = new Date(isoDate)
      return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date)
    } catch {
      return isoDate
    }
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error, payload: SendBillingNotificationPayload) {
    logger.error(
      `[SendBillingNotification] Failed to send email for invoice ${payload.invoiceNumber} after all retries:`,
      error
    )
  }
}
