/*
|--------------------------------------------------------------------------
| Rate Limiter Configuration
|--------------------------------------------------------------------------
|
| This file defines rate limiting rules for the application, similar to
| Rack::Attack in Rails. It provides protection against brute force attacks,
| abuse prevention, and fair usage limits.
|
*/

import limiter from '@adonisjs/limiter/services/main'

/**
 * Global API throttle - 300 requests per 5 minutes per IP
 * Applies to all API endpoints
 */
export const globalThrottle = limiter.define('global', (ctx) => {
  return limiter
    .allowRequests(300)
    .every('5 minutes')
    .usingKey(`global_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage('Demasiadas solicitudes. Por favor, espera antes de intentarlo de nuevo.')
    })
})

/**
 * Authentication throttle - 5 attempts per 20 seconds per email
 * Stricter limits for login/auth endpoints to prevent brute force attacks
 */
export const authThrottle = limiter.define('auth', (ctx) => {
  const email = ctx.request.input('email', '')?.toLowerCase() || ctx.request.ip()

  return limiter
    .allowRequests(5)
    .every('20 seconds')
    .usingKey(`auth_${email}_${ctx.request.ip()}`)
    .blockFor('5 minutes') // Block for 5 minutes after exhausting attempts
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage(
          'Demasiados intentos de autenticación. Por favor, espera 5 minutos antes de intentarlo de nuevo.'
        )
    })
})

/**
 * OTP verification throttle - 5 attempts per minute per email
 * Prevents brute forcing OTP codes
 */
export const otpThrottle = limiter.define('otp', (ctx) => {
  const email = ctx.request.input('email', '')?.toLowerCase() || ctx.request.ip()

  return limiter
    .allowRequests(5)
    .every('1 minute')
    .usingKey(`otp_${email}`)
    .blockFor('10 minutes') // Block for 10 minutes after exhausting attempts
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage('Demasiados intentos de verificación OTP. Por favor, espera 10 minutos.')
    })
})

/**
 * Password reset throttle - 3 attempts per hour per email
 * Prevents abuse of password reset functionality
 */
export const passwordResetThrottle = limiter.define('passwordReset', (ctx) => {
  const email = ctx.request.input('email', '')?.toLowerCase() || ctx.request.ip()

  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(`password_reset_${email}`)
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage(
          'Has solicitado demasiados restablecimientos de contraseña. Por favor, espera una hora.'
        )
    })
})

/**
 * Account creation throttle - 10 accounts per hour per IP
 * Prevents spam account creation
 */
export const signupThrottle = limiter.define('signup', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 hour')
    .usingKey(`signup_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setStatus(429).setMessage('Has creado demasiadas cuentas. Por favor, espera una hora.')
    })
})

/**
 * Email verification resend throttle - 3 attempts per 5 minutes per email
 * Prevents email verification spam
 */
export const verificationResendThrottle = limiter.define('verificationResend', (ctx) => {
  const email = ctx.request.input('email', '')?.toLowerCase() || ctx.request.ip()

  return limiter
    .allowRequests(3)
    .every('5 minutes')
    .usingKey(`verification_resend_${email}`)
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage(
          'Has solicitado demasiados correos de verificación. Por favor, espera 5 minutos.'
        )
    })
})

/**
 * Sensitive operations throttle - 60 requests per 5 minutes per IP
 * For user management operations (create, update, delete)
 */
export const sensitiveThrottle = limiter.define('sensitive', (ctx) => {
  return limiter
    .allowRequests(60)
    .every('5 minutes')
    .usingKey(`sensitive_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage('Demasiadas operaciones sensibles. Por favor, espera antes de continuar.')
    })
})

/**
 * API throttle for authenticated users - 100 requests per minute
 * More lenient for authenticated users
 */
export const apiAuthenticatedThrottle = limiter.define('apiAuthenticated', (ctx) => {
  const userId = ctx.auth?.user?.id || ctx.request.ip()

  return limiter
    .allowRequests(100)
    .every('1 minute')
    .usingKey(`api_auth_${userId}`)
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage('Límite de solicitudes excedido. Por favor, reduce la frecuencia de tus solicitudes.')
    })
})
