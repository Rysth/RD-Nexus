import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import { createUserValidator, updateUserValidator, updatePasswordValidator } from '#validators/user'
import VerificationToken from '#models/verification_token'
import CacheService from '#services/cache_service'
import SendAdminInvitationEmail from '#jobs/send_admin_invitation_email'
import ExcelJS from 'exceljs'
import logger from '@adonisjs/core/services/logger'

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  INDEX: 300, // 5 minutes for list queries
  SHOW: 600,  // 10 minutes for individual user
}

export default class UsersController {
  /**
   * List users with pagination and filters
   * GET /api/v1/users
   */
  async index({ request, response, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 12)
    const search = request.input('search', '')
    const role = request.input('role', '')
    const sortBy = request.input('sort_by', 'created_at')
    const sortDirection = request.input('sort_direction', 'desc')

    const currentUser = auth.user!
    await currentUser.load('roles')
    const isAdmin = currentUser.roles.some((r) => r.name === 'admin')

    // Build cache key from all search parameters
    const cacheKeyParams = [
      `page:${page}`,
      `per_page:${perPage}`,
      `search:${search}`,
      `role:${role}`,
      `sort_by:${sortBy}`,
      `sort_direction:${sortDirection}`,
      `is_admin:${isAdmin}`,
    ].join(':')

    const cacheKey = `users:index:${cacheKeyParams}`

    const result = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = User.query().preload('roles')

        // Filter out admins if current user is not admin
        if (!isAdmin) {
          query = query.whereDoesntHave('roles', (q) => {
            q.where('name', 'admin')
          })
        }

        // Search filter
        if (search) {
          query = query.where((builder) => {
            builder
              .whereILike('email', `%${search}%`)
              .orWhereILike('full_name', `%${search}%`)
              .orWhereILike('username', `%${search}%`)
          })
        }

        // Role filter
        if (role) {
          query = query.whereHas('roles', (q) => {
            q.where('name', role)
          })
        }

        // Sorting
        const validSortFields = ['created_at', 'updated_at', 'email', 'full_name', 'username']
        const validDirections = ['asc', 'desc']
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'
        const finalSortDirection = validDirections.includes(sortDirection) ? sortDirection : 'desc'
        query = query.orderBy(finalSortBy, finalSortDirection as 'asc' | 'desc')

        const users = await query.paginate(page, perPage)

        return {
          users: users.all().map((user) => user.serializeForApi()),
          pagination: {
            current_page: users.currentPage,
            total_pages: users.lastPage,
            total_count: users.total,
            per_page: users.perPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    // Log the ids returned for easier debugging when filtering
    if (search || role) {
      logger.info(
        {
          cacheKey,
          userIds: result.users.map((user) => user.id),
          total: result.pagination.total_count,
        },
        'Users index payload'
      )
    }

    return response.ok(result)
  }

  /**
   * Get a single user
   * GET /api/v1/users/:id
   */
  async show({ params, response }: HttpContext) {
    const userId = params.id
    const cacheKey = `user:${userId}:show`

    const userData = await CacheService.fetch(
      cacheKey,
      async () => {
        const user = await User.find(userId)
        if (!user) {
          return null
        }

        await user.load('roles')
        return user.serializeForApi()
      },
      CACHE_TTL.SHOW
    )

    if (!userData) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    return response.ok({
      user: userData,
    })
  }

  /**
   * Create a new user
   * POST /api/v1/users
   */
  async store({ request, response }: HttpContext) {
    const userData = await request.validateUsing(createUserValidator)
    const rolesInput = request.input('roles', 'user')

    // Check if email already exists
    const existingEmail = await User.findBy('email', userData.user.email)
    if (existingEmail) {
      return response.unprocessableEntity({
        errors: ['El correo electrónico ya está registrado'],
      })
    }

    // Check if username already exists
    if (userData.user.username) {
      const existingUsername = await User.findBy('username', userData.user.username)
      if (existingUsername) {
        return response.unprocessableEntity({
          errors: ['El nombre de usuario ya está en uso'],
        })
      }
    }

    // Create user
    const user = await User.create({
      email: userData.user.email,
      password: userData.user.password || 'TempPassword123!', // Will need to reset
      fullName: userData.user.fullname,
      username: userData.user.username,
      phoneNumber: userData.user.phone_number,
      identification: userData.user.identification,
      status: 2, // verified (admin created)
    })

    // Parse and assign roles
    const roleNames = typeof rolesInput === 'string' ? rolesInput.split(',') : rolesInput
    const roleIds: number[] = []

    for (const roleName of roleNames) {
      const role = await Role.findOrCreateByName(roleName.trim())
      roleIds.push(role.id)
    }

    await user.related('roles').attach(roleIds)
    await user.load('roles')

    // Send admin invitation email with password reset link asynchronously
    const resetToken = await VerificationToken.generateForUser(
      user.id,
      'password_reset',
      24
    )

    await SendAdminInvitationEmail.dispatch({
      email: user.email,
      fullName: user.fullName ?? undefined,
      token: resetToken.token,
    })

    // Invalidate users cache
    await CacheService.invalidateUsers()

    return response.created({
      message: 'Usuario creado exitosamente',
      user: user.serializeForApi(),
    })
  }

  /**
   * Update a user
   * PUT /api/v1/users/:id
   */
  async update({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    const userData = await request.validateUsing(updateUserValidator)
    const rolesInput = request.input('roles')

    // Check if email is being changed to an existing one
    if (userData.user?.email && userData.user.email !== user.email) {
      const existingEmail = await User.findBy('email', userData.user.email)
      if (existingEmail) {
        return response.unprocessableEntity({
          errors: ['El correo electrónico ya está registrado'],
        })
      }
    }

    // Check if username is being changed to an existing one
    if (userData.user?.username && userData.user.username !== user.username) {
      const existingUsername = await User.findBy('username', userData.user.username)
      if (existingUsername) {
        return response.unprocessableEntity({
          errors: ['El nombre de usuario ya está en uso'],
        })
      }
    }

    // Update user fields
    if (userData.user) {
      if (userData.user.email) user.email = userData.user.email
      if (userData.user.fullname !== undefined) user.fullName = userData.user.fullname
      if (userData.user.username !== undefined) user.username = userData.user.username
      if (userData.user.phone_number !== undefined) user.phoneNumber = userData.user.phone_number
      if (userData.user.identification !== undefined)
        user.identification = userData.user.identification
    }

    await user.save()

    // Update roles if provided
    if (rolesInput) {
      const roleNames = typeof rolesInput === 'string' ? rolesInput.split(',') : rolesInput
      const roleIds: number[] = []

      for (const roleName of roleNames) {
        const role = await Role.findOrCreateByName(roleName.trim())
        roleIds.push(role.id)
      }

      await user.related('roles').sync(roleIds)
    }

    await user.load('roles')

    // Invalidate users cache
    await CacheService.invalidateUsers(user.id)

    return response.ok({
      message: 'Usuario actualizado exitosamente',
      user: user.serializeForApi(),
    })
  }

  /**
   * Delete a user
   * DELETE /api/v1/users/:id
   */
  async destroy({ params, response, auth }: HttpContext) {
    const currentUser = auth.user!
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    // Can't delete yourself
    if (user.id === currentUser.id) {
      return response.forbidden({
        error: 'No puedes eliminar tu propio usuario',
      })
    }

    await user.load('roles')
    await currentUser.load('roles')

    const userIsAdmin = user.roles.some((r) => r.name === 'admin')
    const currentUserIsAdmin = currentUser.roles.some((r) => r.name === 'admin')

    // Only admins can delete other admins
    if (userIsAdmin && !currentUserIsAdmin) {
      return response.forbidden({
        error: 'No tienes permiso para eliminar usuarios administradores',
      })
    }

    // Delete user's roles first
    await user.related('roles').detach()

    const userId = user.id

    // Delete user
    await user.delete()

    // Invalidate users cache
    await CacheService.invalidateUsers(userId)

    return response.ok({
      message: 'Usuario eliminado exitosamente',
    })
  }

  /**
   * Toggle user confirmation/verification status
   * PUT /api/v1/users/:id/toggle_confirmation
   */
  async toggleConfirmation({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    await user.load('roles')
    const isAdmin = user.roles.some((r) => r.name === 'admin')

    if (isAdmin) {
      return response.forbidden({
        error: 'No puedes modificar la verificación de usuarios administradores',
      })
    }

    const { confirmed } = request.only(['confirmed'])
    user.status = confirmed ? 2 : 1 // 2 = verified, 1 = unverified
    await user.save()

    // Invalidate users cache
    await CacheService.invalidateUsers(user.id)

    return response.ok({
      message: confirmed ? 'Usuario verificado' : 'Usuario desverificado',
      verified: user.isVerified,
      account_status: user.accountStatus,
    })
  }

  /**
   * Update user password (admin)
   * PUT /api/v1/users/:id/update_password
   */
  async updatePassword({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({
        error: 'Usuario no encontrado',
      })
    }

    const data = await request.validateUsing(updatePasswordValidator)

    if (data.user.password !== data.user.password_confirmation) {
      return response.unprocessableEntity({
        errors: { password: ['Las contraseñas no coinciden'] },
      })
    }

    user.password = data.user.password
    await user.save()

    // Revoke all access tokens for security
    const tokens = await User.accessTokens.all(user)
    for (const token of tokens) {
      await User.accessTokens.delete(user, token.identifier)
    }

    // Invalidate users cache
    await CacheService.invalidateUsers(user.id)

    return response.ok({
      message: 'Contraseña actualizada exitosamente',
    })
  }

  /**
   * Export users to Excel
   * GET /api/v1/users/export
   */
  async export({ request, response, auth }: HttpContext) {
    const search = request.input('search')
    const role = request.input('role')

    const currentUser = auth.user!
    await currentUser.load('roles')
    const isAdmin = currentUser.roles.some((r) => r.name === 'admin')

    let query = User.query().preload('roles')

    // Filter out admins if current user is not admin
    if (!isAdmin) {
      query = query.whereDoesntHave('roles', (q) => {
        q.where('name', 'admin')
      })
    }

    // Search filter
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('email', `%${search}%`)
          .orWhereILike('full_name', `%${search}%`)
          .orWhereILike('username', `%${search}%`)
      })
    }

    // Role filter
    if (role) {
      query = query.whereHas('roles', (q) => {
        q.where('name', role)
      })
    }

    // Order by ID
    query = query.orderBy('id', 'asc')

    const users = await query

    // Build XLSX workbook
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Users')

    const header = [
      'ID',
      'Correo',
      'Nombre completo',
      'Usuario',
      'Teléfono',
      'Identificación',
      'Roles',
      'Estado',
      'Creado el',
    ]

    sheet.addRow(header)

    users.forEach((user) => {
      sheet.addRow([
        user.id,
        user.email ?? '',
        user.fullName ?? '',
        user.username ?? '',
        user.phoneNumber ?? '',
        user.identification ?? '',
        user.roles.map((r) => r.name).join(', '),
        user.accountStatus,
        user.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
      ])
    })

    // Autosize simple columns
    sheet.columns?.forEach((column) => {
      let maxLength = 10
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : ''
        maxLength = Math.max(maxLength, cellValue.length)
      })
      column.width = Math.min(50, maxLength + 2)
    })

    const buffer = await workbook.xlsx.writeBuffer()

    response.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response.header(
      'Content-Disposition',
      `attachment; filename="users_${new Date().toISOString().replace(/[:]/g, '-')}.xlsx"`
    )

    return response.send(buffer)
  }
}
