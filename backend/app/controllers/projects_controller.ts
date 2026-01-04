import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import Client from '#models/client'
import CacheService from '#services/cache_service'
import vine from '@vinejs/vine'

// Cache TTLs (seconds)
const CACHE_TTL = {
  INDEX: 300,
  SHOW: 600,
}

// Validators
const createProjectValidator = vine.compile(
  vine.object({
    client_id: vine.number().positive(),
    name: vine.string().trim().minLength(2).maxLength(200),
    production_url: vine.string().trim().url().maxLength(500).optional(),
    start_date: vine.string().optional(), // ISO date string
    status: vine.string().in(['active', 'maintenance', 'canceled']).optional(),
    description: vine.string().trim().maxLength(2000).optional(),
  })
)

const updateProjectValidator = vine.compile(
  vine.object({
    client_id: vine.number().positive().optional(),
    name: vine.string().trim().minLength(2).maxLength(200).optional(),
    production_url: vine.string().trim().url().maxLength(500).nullable().optional(),
    start_date: vine.string().nullable().optional(),
    status: vine.string().in(['active', 'maintenance', 'canceled']).optional(),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
  })
)

export default class ProjectsController {
  /**
   * GET /api/v1/projects
   * List all projects with optional filters
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 25)
    const search = request.input('search', '')
    const clientId = request.input('client_id')
    const status = request.input('status')
    const sortBy = request.input('sort_by', 'created_at')
    const sortOrder = request.input('sort_order', 'desc')

    const cacheKeyParams = [
      `page:${page}`,
      `per_page:${perPage}`,
      `search:${search}`,
      `client_id:${clientId ?? ''}`,
      `status:${status ?? ''}`,
      `sort_by:${sortBy}`,
      `sort_order:${sortOrder}`,
    ].join(':')

    const cacheKey = `projects:index:${cacheKeyParams}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = Project.query().preload('client')

        // Filter by client
        if (clientId) {
          query = query.where('client_id', clientId)
        }

        // Filter by status
        if (status && ['active', 'maintenance', 'canceled'].includes(status)) {
          query = query.where('status', status)
        }

        // Search by name or URL
        if (search) {
          query = query.where((builder) => {
            builder
              .whereILike('name', `%${search}%`)
              .orWhereILike('production_url', `%${search}%`)
          })
        }

        // Sorting
        const allowedSortFields = ['name', 'status', 'start_date', 'created_at', 'updated_at']
        if (allowedSortFields.includes(sortBy)) {
          query = query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')
        }

        const projects = await query.paginate(page, perPage)

        return {
          data: projects.all().map((p) => ({
            ...p.serializeForApi(),
            client: p.client?.serializeForApi(),
          })),
          meta: {
            total: projects.total,
            per_page: projects.perPage,
            current_page: projects.currentPage,
            last_page: projects.lastPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    return response.ok(payload)
  }

  /**
   * GET /api/v1/projects/:id
   * Show a single project with client info
   */
  async show({ params, response }: HttpContext) {
    const projectId = params.id
    const cacheKey = `project:${projectId}:show`

    const projectData = await CacheService.fetch(
      cacheKey,
      async () => {
        const project = await Project.query()
          .where('id', projectId)
          .preload('client')
          .first()

        if (!project) {
          return null
        }

        return {
          ...project.serializeForApi(),
          client: project.client?.serializeForApi(),
        }
      },
      CACHE_TTL.SHOW
    )

    if (!projectData) {
      return response.notFound({ error: 'Proyecto no encontrado' })
    }

    return response.ok(projectData)
  }

  /**
   * POST /api/v1/projects
   * Create a new project
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createProjectValidator)

    // Check if client exists
    const client = await Client.find(data.client_id)
    if (!client) {
      return response.notFound({ error: 'Cliente no encontrado' })
    }

    const project = await Project.create({
      clientId: data.client_id,
      name: data.name,
      productionUrl: data.production_url || null,
      startDate: data.start_date ? data.start_date : null,
      status: (data.status as 'active' | 'maintenance' | 'canceled') || 'active',
      description: data.description || null,
    })

    await project.load('client')

    await CacheService.invalidateProjects(project.id, data.client_id)

    return response.created({
      ...project.serializeForApi(),
      client: project.client?.serializeForApi(),
    })
  }

  /**
   * PUT /api/v1/projects/:id
   * Update a project
   */
  async update({ params, request, response }: HttpContext) {
    const project = await Project.find(params.id)

    if (!project) {
      return response.notFound({ error: 'Proyecto no encontrado' })
    }

    const data = await request.validateUsing(updateProjectValidator)

    // If changing client, verify it exists
    if (data.client_id && data.client_id !== project.clientId) {
      const client = await Client.find(data.client_id)
      if (!client) {
        return response.notFound({ error: 'Cliente no encontrado' })
      }
    }

    project.merge({
      clientId: data.client_id ?? project.clientId,
      name: data.name ?? project.name,
      productionUrl: data.production_url !== undefined ? data.production_url : project.productionUrl,
      startDate: data.start_date !== undefined ? (data.start_date || null) : project.startDate,
      status: (data.status as 'active' | 'maintenance' | 'canceled') ?? project.status,
      description: data.description !== undefined ? data.description : project.description,
    })

    await project.save()
    await project.load('client')

    await CacheService.invalidateProjects(project.id, project.clientId)

    return response.ok({
      ...project.serializeForApi(),
      client: project.client?.serializeForApi(),
    })
  }

  /**
   * DELETE /api/v1/projects/:id
   * Delete a project
   */
  async destroy({ params, response }: HttpContext) {
    const project = await Project.find(params.id)

    if (!project) {
      return response.notFound({ error: 'Proyecto no encontrado' })
    }

    await project.delete()

    await CacheService.invalidateProjects(project.id, project.clientId)

    return response.ok({ message: 'Proyecto eliminado correctamente' })
  }

  /**
   * GET /api/v1/clients/:clientId/projects
   * List projects for a specific client
   */
  async byClient({ params, request, response }: HttpContext) {
    const client = await Client.find(params.clientId)

    if (!client) {
      return response.notFound({ error: 'Cliente no encontrado' })
    }

    const page = request.input('page', 1)
    const perPage = request.input('per_page', 25)
    const status = request.input('status')

    const cacheKeyParams = [
      `client:${params.clientId}`,
      `page:${page}`,
      `per_page:${perPage}`,
      `status:${status ?? ''}`,
    ].join(':')

    const cacheKey = `client:${params.clientId}:projects:${cacheKeyParams}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = Project.query().where('client_id', params.clientId)

        if (status && ['active', 'maintenance', 'canceled'].includes(status)) {
          query = query.where('status', status)
        }

        const projects = await query.orderBy('created_at', 'desc').paginate(page, perPage)

        return {
          client: client.serializeForApi(),
          data: projects.all().map((p) => p.serializeForApi()),
          meta: {
            total: projects.total,
            per_page: projects.perPage,
            current_page: projects.currentPage,
            last_page: projects.lastPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    return response.ok(payload)
  }
}
