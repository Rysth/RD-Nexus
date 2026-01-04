import { Job } from 'adonisjs-jobs'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

interface SendVerificationEmailPayload {
  email: string
  fullName?: string
  token: string
}

/**
 * SendVerificationEmail Job
 * Sends account verification emails asynchronously
 */
export default class SendVerificationEmail extends Job {
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
   * Handle the send verification email job
   */
  async handle(payload: SendVerificationEmailPayload) {
    const { email, fullName, token } = payload

    try {
      await mail.send((message) => {
        message.to(email).subject('Verifica tu cuenta').htmlView('emails/verify_account', {
          user: { fullName },
          token,
          frontendUrl: env.get('FRONTEND_URL'),
        })
      })

      this.logger.info(`[SendVerificationEmail] Verification email sent to ${email}`)
    } catch (error) {
      this.logger.error(`[SendVerificationEmail] Failed to send verification email to ${email}:`, error)
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error, payload: SendVerificationEmailPayload) {
    this.logger.error(
      `[SendVerificationEmail] Failed to send email to ${payload.email} after all retries:`,
      error
    )
  }
}