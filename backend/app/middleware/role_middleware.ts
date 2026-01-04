import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Role middleware to check if the authenticated user has
 * any of the required roles.
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options?: { roles?: string[] } | string[]) {
    const user = ctx.auth.user!

    // Support both middleware.role(['admin']) and middleware.role({ roles: ['admin'] })
    const requiredRoles = Array.isArray(options) ? options : options?.roles || []

    // No roles specified — allow by default
    if (requiredRoles.length === 0) {
      return next()
    }

    // Load roles if not already loaded
    if (!user.$preloaded.roles) {
      await user.load('roles')
    }

    const userRoles = user.roles.map((role) => role.name)
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))

    if (!hasRequiredRole) {
      return ctx.response.forbidden({
        error: 'No tienes permiso para realizar esta acción',
      })
    }

    return next()
  }
}
