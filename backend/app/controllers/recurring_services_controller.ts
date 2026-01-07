import type { HttpContext } from '@adonisjs/core/http'
import RecurringService from '#models/recurring_service'
import Project from '#models/project'
import CacheService from '#services/cache_service'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

// Cache TTLs (seconds)
const CACHE_TTL = {
  INDEX: 300,
  SHOW: 600,
}

// Validators
const createRecurringServiceValidator = vine.compile(
  vine.object({
    project_id: vine.number().positive(),
    name: vine.string().trim().minLength(2).maxLength(200),
    amount: vine.number().positive(),
    billing_cycle: vine.string().in(['monthly', 'yearly']),
    next_billing_date: vine.string(), // ISO date string
    status: vine.string().in(['active', 'paused']).optional(),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
  })
)

const updateRecurringServiceValidator = vine.compile(
  vine.object({
    project_id: vine.number().positive().optional(),
    name: vine.string().trim().minLength(2).maxLength(200).optional(),
    amount: vine.number().positive().optional(),
    billing_cycle: vine.string().in(['monthly', 'yearly']).optional(),
    next_billing_date: vine.string().optional(),
    status: vine.string().in(['active', 'paused']).optional(),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
  })
)

export default class RecurringServicesController {
  /**
   * GET /api/v1/recurring-services
   * List all recurring services with optional filters
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 25)
    const projectId = request.input('project_id')
    const status = request.input('status')
    const billingCycle = request.input('billing_cycle')

    const cacheKeyParams = [
      `page:${page}`,
      `per_page:${perPage}`,
      `project_id:${projectId ?? ''}`,
      `status:${status ?? ''}`,
      `billing_cycle:${billingCycle ?? ''}`,
    ].join(':')

    const cacheKey = `recurring_services:index:${cacheKeyParams}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = RecurringService.query().preload('project' as any, (projectQuery: any) => {
          projectQuery.preload('client')
        })

        // Filter by project
        if (projectId) {
          query = query.where('project_id', projectId)
        }

        // Filter by status
        if (status && ['active', 'paused'].includes(status)) {
          query = query.where('status', status)
        }

        // Filter by billing cycle
        if (billingCycle && ['monthly', 'yearly'].includes(billingCycle)) {
          query = query.where('billing_cycle', billingCycle)
        }

        const services = await query.orderBy('next_billing_date', 'asc').paginate(page, perPage)

        return {
          data: services.all().map((s) => ({
            ...s.serializeForApi(),
            project: s.project?.serializeForApi(),
          })),
          meta: {
            total: services.total,
            per_page: services.perPage,
            current_page: services.currentPage,
            last_page: services.lastPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    return response.ok(payload)
  }

  /**
   * GET /api/v1/recurring-services/:id
   * Show a single recurring service
   */
  async show({ params, response }: HttpContext) {
    const serviceId = params.id
    const cacheKey = `recurring_service:${serviceId}:show`

    const serviceData = await CacheService.fetch(
      cacheKey,
      async () => {
        const service = await RecurringService.query()
          .where('id', serviceId)
          .preload('project' as any, (projectQuery: any) => {
            projectQuery.preload('client')
          })
          .first()

        if (!service) {
          return null
        }

        return {
          ...service.serializeForApi(),
          project: service.project?.serializeForApi(),
        }
      },
      CACHE_TTL.SHOW
    )

    if (!serviceData) {
      return response.notFound({ error: 'Servicio recurrente no encontrado' })
    }

    return response.ok(serviceData)
  }

  /**
   * POST /api/v1/recurring-services
   * Create a new recurring service
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createRecurringServiceValidator)

    // Check if project exists
    const project = await Project.find(data.project_id)
    if (!project) {
      return response.notFound({ error: 'Proyecto no encontrado' })
    }

    const service = await RecurringService.create({
      projectId: data.project_id,
      name: data.name,
      amount: data.amount,
      billingCycle: data.billing_cycle as 'monthly' | 'yearly',
      nextBillingDate: DateTime.fromISO(data.next_billing_date),
      status: (data.status as 'active' | 'paused') || 'active',
      description: data.description || null,
    })

    await service.load('project' as any, (projectQuery: any) => {
      projectQuery.preload('client')
    })

    await this.invalidateCache(service.id, data.project_id)

    return response.created({
      ...service.serializeForApi(),
      project: service.project?.serializeForApi(),
    })
  }

  /**
   * PUT /api/v1/recurring-services/:id
   * Update a recurring service
   */
  async update({ params, request, response }: HttpContext) {
    const service = await RecurringService.find(params.id)

    if (!service) {
      return response.notFound({ error: 'Servicio recurrente no encontrado' })
    }

    const data = await request.validateUsing(updateRecurringServiceValidator)

    // If changing project, verify it exists
    if (data.project_id && data.project_id !== service.projectId) {
      const project = await Project.find(data.project_id)
      if (!project) {
        return response.notFound({ error: 'Proyecto no encontrado' })
      }
    }

    service.merge({
      projectId: data.project_id ?? service.projectId,
      name: data.name ?? service.name,
      amount: data.amount ?? service.amount,
      billingCycle: (data.billing_cycle as 'monthly' | 'yearly') ?? service.billingCycle,
      nextBillingDate: data.next_billing_date
        ? DateTime.fromISO(data.next_billing_date)
        : service.nextBillingDate,
      status: (data.status as 'active' | 'paused') ?? service.status,
      description: data.description !== undefined ? data.description : service.description,
    })

    await service.save()
    await service.load('project' as any, (projectQuery: any) => {
      projectQuery.preload('client')
    })

    await this.invalidateCache(service.id, service.projectId)

    return response.ok({
      ...service.serializeForApi(),
      project: service.project?.serializeForApi(),
    })
  }

  /**
   * DELETE /api/v1/recurring-services/:id
   * Delete a recurring service
   */
  async destroy({ params, response }: HttpContext) {
    const service = await RecurringService.find(params.id)

    if (!service) {
      return response.notFound({ error: 'Servicio recurrente no encontrado' })
    }

    const projectId = service.projectId
    await service.delete()

    await this.invalidateCache(service.id, projectId)

    return response.ok({ message: 'Servicio recurrente eliminado correctamente' })
  }

  /**
   * GET /api/v1/projects/:projectId/recurring-services
   * List recurring services for a specific project
   */
  async byProject({ params, request, response }: HttpContext) {
    const project = await Project.find(params.projectId)

    if (!project) {
      return response.notFound({ error: 'Proyecto no encontrado' })
    }

    const page = request.input('page', 1)
    const perPage = request.input('per_page', 25)
    const status = request.input('status')

    const cacheKeyParams = [
      `project:${params.projectId}`,
      `page:${page}`,
      `per_page:${perPage}`,
      `status:${status ?? ''}`,
    ].join(':')

    const cacheKey = `project:${params.projectId}:recurring_services:${cacheKeyParams}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = RecurringService.query().where('project_id', params.projectId)

        if (status && ['active', 'paused'].includes(status)) {
          query = query.where('status', status)
        }

        const services = await query.orderBy('next_billing_date', 'asc').paginate(page, perPage)

        return {
          project: project.serializeForApi(),
          data: services.all().map((s) => s.serializeForApi()),
          meta: {
            total: services.total,
            per_page: services.perPage,
            current_page: services.currentPage,
            last_page: services.lastPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    return response.ok(payload)
  }

  /**
   * PATCH /api/v1/recurring-services/:id/toggle-status
   * Toggle status between active and paused
   */
  async toggleStatus({ params, response }: HttpContext) {
    const service = await RecurringService.find(params.id)

    if (!service) {
      return response.notFound({ error: 'Servicio recurrente no encontrado' })
    }

    service.status = service.status === 'active' ? 'paused' : 'active'
    await service.save()

    await service.load('project' as any, (projectQuery: any) => {
      projectQuery.preload('client')
    })

    await this.invalidateCache(service.id, service.projectId)

    return response.ok({
      ...service.serializeForApi(),
      project: service.project?.serializeForApi(),
    })
  }

  /**
   * Invalidate cache for recurring services
   */
  private async invalidateCache(serviceId: number, projectId: number) {
    await CacheService.deleteMatched('recurring_services:index:*')
    await CacheService.deleteMatched(`recurring_service:${serviceId}:*`)
    await CacheService.deleteMatched(`project:${projectId}:recurring_services:*`)
  }
}