import vine from '@vinejs/vine'

/**
 * Validator for user registration
 */
export const registerValidator = vine.compile(
  vine.object({
    'email': vine.string().email().normalizeEmail(),
    'password': vine.string().minLength(8).maxLength(100),
    'password-confirm': vine.string().sameAs('password'),
    'fullname': vine.string().minLength(2).maxLength(100),
    'username': vine.string().minLength(3).maxLength(50).optional(),
  })
)

/**
 * Validator for user login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)
