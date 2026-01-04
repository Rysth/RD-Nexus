import { Job } from 'adonisjs-jobs'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

interface SendPasswordResetEmailPayload {
  email: string
  fullName?: string
  token: string
}

/**
 * SendPasswordResetEmail Job
 * Sends password reset emails asynchronously
 */
export default class SendPasswordResetEmail extends Job {
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
   * Handle the send password reset email job
   */
  async handle(payload: SendPasswordResetEmailPayload) {
    const { email, fullName, token } = payload

    try {
      await mail.send((message) => {
        message.to(email).subject('Restablecer contraseña').htmlView('emails/reset_password', {
          user: { fullName },
          token,
          frontendUrl: env.get('FRONTEND_URL'),
        })
      })

      this.logger.info(`[SendPasswordResetEmail] Password reset email sent to ${email}`)
    } catch (error) {
      this.logger.error(`[SendPasswordResetEmail] Failed to send password reset email to ${email}:`, error)
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error, payload: SendPasswordResetEmailPayload) {
    this.logger.error(
      `[SendPasswordResetEmail] Failed to send email to ${payload.email} after all retries:`,
      error
    )
  }
}