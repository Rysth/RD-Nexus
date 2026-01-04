import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

// Fields to filter out from logs for security
const SENSITIVE_FIELDS = ['password', 'password_confirmation', 'current_password', 'token', 'code']

function filterSensitiveData(data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') return data

  const filtered: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      filtered[key] = '[FILTERED]'
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value)
    } else {
      filtered[key] = value
    }
  }
  return filtered
}

export default class LogRequestMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const startTime = Date.now()

    // Gather query params and body for logging
    const queryParams = request.qs()
    const body = request.body()
    const hasQuery = Object.keys(queryParams).length > 0
    const hasBody = Object.keys(body).length > 0

    // Log request with params
    logger.info({
      type: 'request',
      method: request.method(),
      url: request.url(),
      ip: request.ip(),
      userAgent: request.header('user-agent'),
      ...(hasQuery && { query: filterSensitiveData(queryParams) }),
      ...(hasBody && { body: filterSensitiveData(body) }),
    }, `${request.method()} ${request.url()}`)

    // Process the request
    await next()

    // Log response
    const duration = Date.now() - startTime
    logger.info({
      type: 'response',
      method: request.method(),
      url: request.url(),
      status: response.getStatus(),
      duration: `${duration}ms`,
    }, `${request.method()} ${request.url()} - ${response.getStatus()} (${duration}ms)`)
  }
}
