import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

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
      host: env.get('SMTP_HOST', 'mailpit'),
      port: Number(env.get('SMTP_PORT', 1025)),
      secure: env.get('SMTP_SECURE', 'false') === 'true',
      // Solo configurar auth si hay credenciales
      ...(env.get('SMTP_USERNAME')
        ? {
            auth: {
              type: 'login' as const,
              user: env.get('SMTP_USERNAME'),
              pass: env.get('SMTP_PASSWORD'),
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
