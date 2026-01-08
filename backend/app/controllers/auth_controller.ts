import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import VerificationToken from '#models/verification_token'
import OtpCode from '#models/otp_code'
import { registerValidator, loginValidator } from '#validators/auth'
import { updateProfileValidator, updatePasswordValidator } from '#validators/profile'
import CacheService from '#services/cache_service'
import hash from '@adonisjs/core/services/hash'
import SendOtpEmail from '#jobs/send_otp_email'
import SendVerificationEmail from '#jobs/send_verification_email'
import SendPasswordResetEmail from '#jobs/send_password_reset_email'
import logger from '@adonisjs/core/services/logger'

export default class AuthController {
  /**
   * Register a new user
   * POST /api/v1/create-account
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    // Check if email already exists
    const existingUser = await User.findBy('email', data.email)
    if (existingUser) {
      return response.unprocessableEntity({
        errors: ['El correo electrónico ya está registrado'],
      })
    }

    // Check if username already exists
    if (data.username) {
      const existingUsername = await User.findBy('username', data.username)
      if (existingUsername) {
        return response.unprocessableEntity({
          errors: ['El nombre de usuario ya está en uso'],
        })
      }
    }

    // Create the user
    const user = await User.create({
      email: data.email,
      password: data.password,
      fullName: data.fullname,
      username: data.username,
      status: 1, // unverified
    })

    // Assign default role
    const userRole = await Role.findOrCreateByName('user')
    await user.related('roles').attach([userRole.id])

    // Generate verification token
    const verificationToken = await VerificationToken.generateForUser(user.id, 'email_verification')

    // Send verification email asynchronously via job
    await SendVerificationEmail.dispatch({
      email: user.email,
      fullName: user.fullName ?? undefined,
      token: verificationToken.token,
    })

    return response.created({
      message: 'Cuenta creada exitosamente. Por favor, verifica tu correo electrónico.',
    })
  }

  /**
   * Login user
   * POST /api/v1/login
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    logger.info({ email }, '[LOGIN] Attempt for email')

    // Find user by email
    const user = await User.findBy('email', email)
    if (!user) {
      logger.warn({ email }, '[LOGIN] User not found')
      return response.unauthorized({
        error: 'Credenciales incorrectas',
      })
    }

    logger.info({ userId: user.id, email, passwordHash: user.password.substring(0, 20) + '...' }, '[LOGIN] User found, verifying credentials')

    // Verify password using hash.verify directly (more reliable)
    try {
      const isValidDirect = await hash.verify(user.password, password)
      logger.info({ userId: user.id, isValidDirect }, '[LOGIN] Direct hash.verify result')

      if (!isValidDirect) {
        logger.warn({ userId: user.id, email }, '[LOGIN] Password verification failed')
        return response.unauthorized({
          error: 'Credenciales incorrectas',
        })
      }
    } catch (err) {
      logger.error({ userId: user.id, error: err }, '[LOGIN] Error during password verification')
      return response.unauthorized({
        error: 'Credenciales incorrectas',
      })
    }

    // Check if account is verified
    if (user.status === 1) {
      logger.warn({ userId: user.id }, '[LOGIN] Account not verified')
      return response.forbidden({
        error: 'Tu cuenta no está verificada. Revisa tu correo electrónico.',
      })
    }

    // Check if account is closed
    if (user.status === 3) {
      logger.warn({ userId: user.id }, '[LOGIN] Account is closed')
      return response.forbidden({
        error: 'Esta cuenta ha sido desactivada.',
      })
    }

    logger.info({ userId: user.id }, '[LOGIN] Credentials valid, generating OTP')

    // Generate OTP for two-factor authentication
    const otp = await OtpCode.generateForUser(user.id)

    // Send OTP email asynchronously via job
    await SendOtpEmail.dispatch({
      email: user.email,
      code: otp.code,
      fullName: user.fullName ?? undefined,
    })

    logger.info({ userId: user.id, email }, '[LOGIN] OTP sent successfully')

    return response.ok({
      otp_required: true,
      message: 'Código OTP enviado a tu correo electrónico',
      otp_expires_at: otp.expiresAt.toISO(),
    })
  }

  /**
   * Verify OTP and complete login
   * POST /api/v1/auth/verify_otp
   */
  async verifyOtp({ request, response }: HttpContext) {
    const { email, code } = request.only(['email', 'code'])

    if (!code) {
      return response.badRequest({
        success: false,
        error: 'El código es requerido',
      })
    }

    // Email can come from request body or we need to find by code
    let user: User | null = null

    if (email) {
      user = await User.findBy('email', email)
    } else {
      // Find user by most recent OTP code if email not provided
      const otp = await OtpCode.query()
        .where('code', code)
        .whereNull('used_at')
        .preload('user')
        .first()
      
      if (otp) {
        user = otp.user
      }
    }

    if (!user) {
      return response.unauthorized({
        success: false,
        error: 'Usuario no encontrado',
      })
    }

    // Verify OTP
    const otp = await OtpCode.verifyForUser(user.id, code)
    if (!otp) {
      return response.unprocessableEntity({
        success: false,
        error: 'Código inválido o expirado',
      })
    }

    // Mark OTP as used
    await otp.markAsUsed()

    // Load user roles
    await user.load('roles')

    // Generate access token
    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '30 days',
    })

    return response.ok({
      success: true,
      user: user.serializeForApi(),
      token: {
        type: 'bearer',
        value: token.value!.release(),
        expires_at: token.expiresAt,
      },
    })
  }

  /**
   * Resend OTP
   * POST /api/v1/auth/send_otp
   */
  async resendOtp({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.badRequest({
        success: false,
        error: 'Email es requerido',
      })
    }

    const user = await User.findBy('email', email)
    if (!user) {
      return response.notFound({
        success: false,
        error: 'Usuario no encontrado',
      })
    }

    // Generate new OTP
    const otp = await OtpCode.generateForUser(user.id)

    // Send OTP email asynchronously via job
    await SendOtpEmail.dispatch({
      email: user.email,
      code: otp.code,
      fullName: user.fullName ?? undefined,
    })

    return response.ok({
      success: true,
      message: 'Código OTP reenviado exitosamente',
      otp_expires_at: otp.expiresAt.toISO(),
    })
  }

  /**
   * Get current user info
   * GET /api/v1/me
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    await user.load('roles')

    return response.ok({
      user: user.serializeForApi(),
    })
  }

  /**
   * Logout user
   * POST /api/v1/logout
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!

    // Delete current access token
    await User.accessTokens.delete(user, user.currentAccessToken!.identifier)

    return response.ok({
      message: 'Sesión cerrada exitosamente',
    })
  }

  /**
   * Update current user's profile
   * PUT /api/v1/profile/update_info
   */
  async updateProfile({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const { profile } = await request.validateUsing(updateProfileValidator)

    // No payload provided
    if (!profile || Object.keys(profile).length === 0) {
      return response.badRequest({
        error: 'No se enviaron datos para actualizar',
      })
    }

    // Email uniqueness
    if (profile.email && profile.email !== user.email) {
      const existing = await User.findBy('email', profile.email)
      if (existing) {
        return response.unprocessableEntity({
          errors: ['El correo electrónico ya está registrado'],
        })
      }
      user.email = profile.email
    }

    // Username uniqueness
    if (profile.username && profile.username !== user.username) {
      const existingUsername = await User.findBy('username', profile.username)
      if (existingUsername) {
        return response.unprocessableEntity({
          errors: ['El nombre de usuario ya está en uso'],
        })
      }
      user.username = profile.username
    }

    if (profile.fullname !== undefined) user.fullName = profile.fullname
    if (profile.identification !== undefined) user.identification = profile.identification
    if (profile.phone_number !== undefined) user.phoneNumber = profile.phone_number

    await user.save()
    await user.load('roles')
    await CacheService.invalidateUsers(user.id)

    return response.ok({
      user: user.serializeForApi(),
    })
  }

  /**
   * Update current user's password
   * PUT /api/v1/profile/update_password
   */
  async updatePassword({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { profile } = await request.validateUsing(updatePasswordValidator)

    // Verify current password
    const isValid = await hash.verify(user.password, profile.current_password)
    if (!isValid) {
      return response.unprocessableEntity({
        error: 'La contraseña actual no es correcta',
        field: 'current_password',
      })
    }

    user.password = profile.password
    await user.save()

    // Revoke all access tokens for security
    const tokens = await User.accessTokens.all(user)
    for (const token of tokens) {
      await User.accessTokens.delete(user, token.identifier)
    }

    await CacheService.invalidateUsers(user.id)

    return response.ok({
      message: 'Contraseña actualizada exitosamente',
    })
  }

  /**
   * Verify email
   * POST /api/v1/verify-account
   */
  async verifyEmail({ request, response }: HttpContext) {
    const { key } = request.only(['key'])

    if (!key) {
      return response.badRequest({
        error: 'Token es requerido',
      })
    }

    const token = await VerificationToken.findValidToken(key, 'email_verification')
    if (!token) {
      return response.unauthorized({
        error: 'Token inválido o expirado',
      })
    }

    // Get user and update status
    const user = await User.find(token.userId)
    if (!user) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    user.status = 2 // verified
    await user.save()

    // Mark token as used
    await token.markAsUsed()

    return response.ok({
      message: 'Cuenta verificada exitosamente',
    })
  }

  /**
   * Resend verification email
   * POST /api/v1/verify-account-resend
   */
  async resendVerification({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.badRequest({
        error: 'Email es requerido',
      })
    }

    const user = await User.findBy('email', email)
    if (!user) {
      return response.unauthorized({
        error: 'Usuario no encontrado',
      })
    }

    if (user.isVerified) {
      return response.unauthorized({
        error: 'Esta cuenta ya está verificada',
      })
    }

    // Check for recent token
    const existingToken = await VerificationToken.query()
      .where('user_id', user.id)
      .where('type', 'email_verification')
      .whereNull('used_at')
      .first()

    if (existingToken && !existingToken.canResendEmail(2)) {
      return response.tooManyRequests({
        error: 'Por favor espera antes de solicitar otro correo',
      })
    }

    // Generate new token
    const verificationToken = await VerificationToken.generateForUser(user.id, 'email_verification')

    // Send email asynchronously via job
    await SendVerificationEmail.dispatch({
      email: user.email,
      fullName: user.fullName ?? undefined,
      token: verificationToken.token,
    })

    return response.ok({
      message: 'Correo de verificación enviado',
    })
  }

  /**
   * Request password reset
   * POST /api/v1/reset-password-request
   */
  async requestPasswordReset({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.badRequest({
        error: 'Email es requerido',
      })
    }

    const user = await User.findBy('email', email)
    if (!user) {
      // Don't reveal if user exists
      return response.ok({
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
      })
    }

    // Generate reset token
    const resetToken = await VerificationToken.generateForUser(user.id, 'password_reset', 1) // 1 hour expiry

    // Send email asynchronously via job
    await SendPasswordResetEmail.dispatch({
      email: user.email,
      fullName: user.fullName ?? undefined,
      token: resetToken.token,
    })

    return response.ok({
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
    })
  }

  /**
   * Reset password
   * POST /api/v1/reset-password
   */
  async resetPassword({ request, response }: HttpContext) {
    const {
      key,
      password,
      'password-confirm': passwordConfirm,
    } = request.only(['key', 'password', 'password-confirm'])

    if (!key || !password || !passwordConfirm) {
      return response.badRequest({
        error: 'Todos los campos son requeridos',
      })
    }

    if (password !== passwordConfirm) {
      return response.unprocessableEntity({
        error: 'Las contraseñas no coinciden',
      })
    }

    if (password.length < 8) {
      return response.unprocessableEntity({
        error: 'La contraseña debe tener al menos 8 caracteres',
      })
    }

    const token = await VerificationToken.findValidToken(key, 'password_reset')
    if (!token) {
      return response.unauthorized({
        error: 'Token inválido o expirado',
      })
    }

    const user = await User.find(token.userId)
    if (!user) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    // Update password
    user.password = password
    await user.save()

    // Mark token as used
    await token.markAsUsed()

    // Revoke all access tokens for security
    const tokens = await User.accessTokens.all(user)
    for (const t of tokens) {
      await User.accessTokens.delete(user, t.identifier)
    }

    return response.ok({
      message: 'Contraseña restablecida exitosamente',
    })
  }
}
