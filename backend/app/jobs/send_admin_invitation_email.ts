import { Job } from 'adonisjs-jobs'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

interface SendAdminInvitationEmailPayload {
  email: string
  fullName?: string
  token: string
}

/**
 * SendAdminInvitationEmail Job
 * Sends admin invitation emails asynchronously
 */
export default class SendAdminInvitationEmail extends Job {
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
   * Handle the send admin invitation email job
   */
  async handle(payload: SendAdminInvitationEmailPayload) {
    const { email, fullName, token } = payload

    try {
      await mail.send((message) => {
        message
          .to(email)
          .subject('Te han invitado a Nexus (by RysthDesign)')
          .htmlView('emails/admin_invitation', {
            user: { fullName },
            token,
            frontendUrl: env.get('FRONTEND_URL'),
          })
          .textView('emails/admin_invitation_text', {
            user: { fullName },
            token,
            frontendUrl: env.get('FRONTEND_URL'),
          })
      })

      this.logger.info(`[SendAdminInvitationEmail] Admin invitation email sent to ${email}`)
    } catch (error) {
      this.logger.error(`[SendAdminInvitationEmail] Failed to send admin invitation email to ${email}:`, error)
      throw error // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Handle job failure after all retries exhausted
   */
  async rescue(error: Error, payload: SendAdminInvitationEmailPayload) {
    this.logger.error(
      `[SendAdminInvitationEmail] Failed to send email to ${payload.email} after all retries:`,
      error
    )
  }
}