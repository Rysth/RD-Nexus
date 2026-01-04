import vine from '@vinejs/vine'

/**
 * Validator for creating a user
 */
export const createUserValidator = vine.compile(
  vine.object({
    user: vine.object({
      email: vine.string().email().normalizeEmail(),
      password: vine.string().minLength(8).maxLength(100).optional(),
      password_confirmation: vine.string().optional(),
      fullname: vine.string().minLength(2).maxLength(100),
      username: vine.string().minLength(3).maxLength(50).optional(),
      phone_number: vine.string().maxLength(20).optional(),
      identification: vine.string().maxLength(50).optional(),
    }),
  })
)

/**
 * Validator for updating a user
 */
export const updateUserValidator = vine.compile(
  vine.object({
    user: vine
      .object({
        email: vine.string().email().normalizeEmail().optional(),
        fullname: vine.string().minLength(2).maxLength(100).optional(),
        username: vine.string().minLength(3).maxLength(50).optional().nullable(),
        phone_number: vine.string().maxLength(20).optional().nullable(),
        identification: vine.string().maxLength(50).optional().nullable(),
      })
      .optional(),
  })
)

/**
 * Validator for updating user password
 */
export const updatePasswordValidator = vine.compile(
  vine.object({
    user: vine.object({
      password: vine.string().minLength(8).maxLength(100),
      password_confirmation: vine.string(),
    }),
  })
)
