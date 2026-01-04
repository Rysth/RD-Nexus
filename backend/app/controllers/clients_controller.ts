import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import vine from '@vinejs/vine'

// Validators
const createClientValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(200),
    identification_type: vine.string().trim().in(['04', '05', '06']),
    identification: vine.string().trim().minLength(5).maxLength(20),
    email: vine.string().email().optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    address: vine.string().trim().maxLength(500).optional(),
    notes: vine.string().trim().maxLength(1000).optional(),
  })
)

const updateClientValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(200).optional(),
    identification_type: vine.string().trim().in(['04', '05', '06']).optional(),
    identification: vine.string().trim().minLength(5).maxLength(20).optional(),
    email: vine.string().email().nullable().optional(),
    phone: vine.string().trim().maxLength(20).nullable().optional(),
    address: vine.string().trim().maxLength(500).nullable().optional(),
    notes: vine.string().trim().maxLength(1000).nullable().optional(),
  })
)

export default class ClientsController {
  /**
   * GET /api/v1/clients
   * List all clients with optional search and pagination
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 25)
    const search = request.input('search', '')
    const sortBy = request.input('sort_by', 'created_at')
    const sortOrder = request.input('sort_order', 'desc')

    let query = Client.query()

    // Search by name, identification, or email
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereILike('identification', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      })
    }

    // Sorting
    const allowedSortFields = ['name', 'identification', 'created_at', 'updated_at']
    if (allowedSortFields.includes(sortBy)) {
      query = query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')
    }

    const clients = await query.paginate(page, perPage)

    return response.ok({
      data: clients.all().map((c) => c.serializeForApi()),
      meta: {
        total: clients.total,
        per_page: clients.perPage,
        current_page: clients.currentPage,
        last_page: clients.lastPage,
      },
    })
  }

  /**
   * GET /api/v1/clients/:id
   * Show a single client with projects
   */
  async show({ params, response }: HttpContext) {
    const client = await Client.query()
      .where('id', params.id)
      .preload('projects')
      .first()

    if (!client) {
      return response.notFound({ error: 'Cliente no encontrado' })
    }

    return response.ok({
      ...client.serializeForApi(),
      projects: client.projects.map((p) => p.serializeForApi()),
    })
  }

  /**
   * POST /api/v1/clients
   * Create a new client
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createClientValidator)

    // Check if identification already exists
    const existing = await Client.findBy('identification', data.identification)
    if (existing) {
      return response.conflict({
        error: 'Ya existe un cliente con esta identificación',
      })
    }

    const client = await Client.create({
      name: data.name,
      identificationType: data.identification_type,
      identification: data.identification,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    })

    return response.created(client.serializeForApi())
  }

  /**
   * PUT /api/v1/clients/:id
   * Update a client
   */
  async update({ params, request, response }: HttpContext) {
    const client = await Client.find(params.id)

    if (!client) {
      return response.notFound({ error: 'Cliente no encontrado' })
    }

    const data = await request.validateUsing(updateClientValidator)

    // If identification changed, check for duplicates
    if (data.identification && data.identification !== client.identification) {
      const existing = await Client.query()
        .where('identification', data.identification)
        .whereNot('id', client.id)
        .first()

      if (existing) {
        return response.conflict({
          error: 'Ya existe otro cliente con esta identificación',
        })
      }
    }

    client.merge({
      name: data.name ?? client.name,
      identificationType: data.identification_type ?? client.identificationType,
      identification: data.identification ?? client.identification,
      email: data.email !== undefined ? data.email : client.email,
      phone: data.phone !== undefined ? data.phone : client.phone,
      address: data.address !== undefined ? data.address : client.address,
      notes: data.notes !== undefined ? data.notes : client.notes,
    })

    await client.save()

    return response.ok(client.serializeForApi())
  }

  /**
   * DELETE /api/v1/clients/:id
   * Delete a client (cascades to projects)
   */
  async destroy({ params, response }: HttpContext) {
    const client = await Client.find(params.id)

    if (!client) {
      return response.notFound({ error: 'Cliente no encontrado' })
    }

    await client.delete()

    return response.ok({ message: 'Cliente eliminado correctamente' })
  }
}
