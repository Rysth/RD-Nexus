import { Job } from 'adonisjs-jobs'
import mail from '@adonisjs/mail/services/main'

interface SendOtpEmailPayload {
  email: string
  code: string
  fullName?: string
}

/**
 * SendOtpEmail Job
 * Sends OTP verification emails asynchronously
 */
export default class SendOtpEmail extends Job {
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
   * Handle the send OTP email job
   */
  async handle(payload: SendOtpEmailPayload) {
    const { email, code, fullName } = payload

    try {
      await mail.send((message) => {
        message.to(email).subject('Código de verificación').htmlView('emails/otp', {
          user: { fullName },
          code,
        })
      })

      this.logger.info(`[SendOtpEmail] OTP email sent to ${email}`)
    } catch (error) {
      this.logger.error(`[SendOtpEmail] Failed to send OTP email to ${email}:`, error)
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error, payload: SendOtpEmailPayload) {
    this.logger.error(
      `[SendOtpEmail] Failed to send email to ${payload.email} after all retries:`,
      error
    )
    // Optionally: store failed email for manual review or send alert
  }
}