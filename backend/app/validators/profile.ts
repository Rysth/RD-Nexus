import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    profile: vine.object({
      email: vine.string().email().normalizeEmail().optional(),
      username: vine.string().minLength(3).maxLength(50).optional(),
      fullname: vine.string().minLength(2).maxLength(100).optional(),
      identification: vine.string().maxLength(100).optional(),
      phone_number: vine.string().maxLength(30).optional(),
    }),
  })
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    profile: vine.object({
      current_password: vine.string(),
      password: vine.string().minLength(8).maxLength(100),
      password_confirmation: vine.string().sameAs('password'),
    }),
  })
)
