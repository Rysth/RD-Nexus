import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  /**
   * A static address for the "from" property. It will be
   * used unless an explicit from address is set on the
   * Email
   */
  from: {
    address: env.get('SMTP_FROM_ADDRESS', 'support@rysthdesign.com'),
    name: env.get('SMTP_FROM_NAME', 'Nexus by RysthDesign'),
  },

  /**
   * A static address for the "reply-to" property. It will
   * be used unless an explicit replyTo address is set on
   * the Email
   */
  replyTo: {
    address: env.get('SMTP_REPLY_TO', 'support@rysthdesign.com'),
    name: 'Nexus Support',
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   * 
   * Hostinger SMTP: smtp.hostinger.com:465 (SSL) or :587 (TLS)
   */
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'smtp.hostinger.com'),
      port: Number(env.get('SMTP_PORT', 465)),
      secure: env.get('SMTP_SECURE', 'true') === 'true',
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME'),
        pass: env.get('SMTP_PASSWORD'),
      },
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
