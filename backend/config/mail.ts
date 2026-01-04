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
    address: 'noreply@nexus.rysthdesign.com',
    name: 'Nexus by RysthDesign',
  },

  /**
   * A static address for the "reply-to" property. It will
   * be used unless an explicit replyTo address is set on
   * the Email
   */
  replyTo: {
    address: 'support@nexus.rysthdesign.com',
    name: 'Nexus Support',
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST') || 'localhost',
      port: Number(env.get('SMTP_PORT')) || 1025,
      /**
       * Uncomment the auth block if your SMTP
       * server needs authentication
       */
      // auth: {
      //   type: 'login',
      //   user: env.get('SMTP_USERNAME'),
      //   pass: env.get('SMTP_PASSWORD'),
      // },
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
