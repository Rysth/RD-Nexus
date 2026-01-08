import vine from '@vinejs/vine'

/**
 * Validator for user registration
 * Note: We don't use normalizeEmail() because it removes dots from Gmail addresses
 * which causes lookup mismatches if users register with dots in their email.
 */
export const registerValidator = vine.compile(
  vine.object({
    'email': vine.string().email(),
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
    email: vine.string().email(),
    password: vine.string(),
  })
)
