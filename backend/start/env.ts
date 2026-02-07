/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  APP_URL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.string.optional(),
  SMTP_SECURE: Env.schema.string.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  SMTP_FROM_ADDRESS: Env.schema.string.optional(),
  SMTP_FROM_NAME: Env.schema.string.optional(),
  SMTP_REPLY_TO: Env.schema.string.optional(),
  SMTP_REPLY_NAME: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Frontend URL for email links
  |----------------------------------------------------------
  */
  FRONTEND_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Redis
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string.optional(),
  REDIS_PORT: Env.schema.number.optional(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Drive (file storage)
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['fs', 'r2'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring Cloudflare R2 (production)
  |----------------------------------------------------------
  */
  R2_ACCESS_KEY_ID: Env.schema.string.optional(),
  R2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  R2_BUCKET: Env.schema.string.optional(),
  R2_ENDPOINT: Env.schema.string.optional(),
  R2_CDN_URL: Env.schema.string.optional(),
  REDIS_QUEUE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for SRI Ecuador - Electronic Billing
  |----------------------------------------------------------
  */
  SRI_ENVIRONMENT: Env.schema.enum(['1', '2'] as const).optional(),
  SRI_CERTIFICATE_PATH: Env.schema.string.optional(),
  SRI_CERTIFICATE_PASSWORD: Env.schema.string.optional(),
  SRI_RUC: Env.schema.string.optional(),
  SRI_RAZON_SOCIAL: Env.schema.string.optional(),
  SRI_NOMBRE_COMERCIAL: Env.schema.string.optional(),
  SRI_DIRECCION_MATRIZ: Env.schema.string.optional(),
  SRI_CODIGO_ESTABLECIMIENTO: Env.schema.string.optional(),
  SRI_PUNTO_EMISION: Env.schema.string.optional(),
  SRI_OBLIGADO_CONTABILIDAD: Env.schema.enum(['SI', 'NO'] as const).optional(),
  SRI_CONTRIBUYENTE_ESPECIAL: Env.schema.string.optional(),
  SRI_REGIMEN_RIMPE: Env.schema.string.optional(),
})
