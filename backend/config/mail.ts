import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const smtpHost = env.get('SMTP_HOST', 'mailpit')
const smtpPort = Number(env.get('SMTP_PORT', '1025'))
// If SMTP_SECURE is not explicitly set, infer it from the port.
// 465 = implicit TLS, 587/25 = plain + STARTTLS.
const smtpSecureEnv = env.get('SMTP_SECURE', '').trim().toLowerCase()
const smtpSecure = smtpSecureEnv.length
  ? ['1', 'true', 'yes', 'on'].includes(smtpSecureEnv)
  : smtpPort === 465
const smtpUser = env.get('SMTP_USERNAME')
const smtpPass = env.get('SMTP_PASSWORD')

const mailConfig = defineConfig({
  default: 'smtp',

  from: {
    address: env.get('SMTP_FROM_ADDRESS', 'support@rysthdesign.com'),
    name: env.get('SMTP_FROM_NAME', 'Nexus by RysthDesign'),
  },

  replyTo: {
    address: env.get('SMTP_REPLY_TO', 'support@rysthdesign.com'),
    name: env.get('SMTP_REPLY_NAME', 'Nexus Support'),
  },

  /**
   * Mailpit (dev): SMTP_HOST=mailpit, SMTP_PORT=1025, SMTP_SECURE=false, sin auth
   * Hostinger (prod): SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465, SMTP_SECURE=true, con user/pass
   */
  mailers: {
    smtp: transports.smtp({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      // Make failures surface fast (helps production debugging)
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      ...(smtpUser && smtpPass
        ? {
            auth: {
              type: 'login' as const,
              user: smtpUser,
              pass: smtpPass,
            },
          }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
