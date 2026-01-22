import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote'
import QuoteItem from '#models/quote_item'
import Client from '#models/client'
import Project from '#models/project'
import CacheService from '#services/cache_service'
import InvoiceService from '#services/invoice_service'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

// Cache TTLs (seconds)
const CACHE_TTL = {
  INDEX: 300,
  SHOW: 600,
}

// Validators
const quoteItemSchema = vine.object({
  id: vine.number().positive().optional(),
  description: vine.string().trim().minLength(1).maxLength(500),
  quantity: vine.number().positive(),
  unit_price: vine.number().min(0),
  payment_type: vine.enum(['unico', 'anual', 'mensual']).optional(),
  notes: vine.string().trim().maxLength(2000).nullable().optional(),
})

const createQuoteValidator = vine.compile(
  vine.object({
    client_id: vine.number().positive(),
    project_id: vine.number().positive().nullable().optional(),
    title: vine.string().trim().minLength(2).maxLength(200),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
    issue_date: vine.string(), // ISO date string
    valid_until: vine.string(), // ISO date string
    discount_percent: vine.number().min(0).max(100).optional(),
    tax_rate: vine.number().min(0).max(100).optional(),
    terms_conditions: vine.string().trim().maxLength(5000).nullable().optional(),
    notes: vine.string().trim().maxLength(2000).nullable().optional(),
    items: vine.array(quoteItemSchema).minLength(1),
  })
)

const updateQuoteValidator = vine.compile(
  vine.object({
    client_id: vine.number().positive().optional(),
    project_id: vine.number().positive().nullable().optional(),
    title: vine.string().trim().minLength(2).maxLength(200).optional(),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
    issue_date: vine.string().optional(),
    valid_until: vine.string().optional(),
    status: vine.string().in(['draft', 'sent', 'approved', 'rejected']).optional(),
    discount_percent: vine.number().min(0).max(100).optional(),
    tax_rate: vine.number().min(0).max(100).optional(),
    terms_conditions: vine.string().trim().maxLength(5000).nullable().optional(),
    notes: vine.string().trim().maxLength(2000).nullable().optional(),
    items: vine.array(quoteItemSchema).optional(),
  })
)

export default class QuotesController {
  /**
   * Generate unique quote number: NXS-YYYY-XXXXXX (sequential per year)
   */
  private async generateQuoteNumber(): Promise<string> {
    const year = DateTime.now().toFormat('yyyy')
    const prefix = `NXS-${year}-`

    // Find the last quote number for this year
    const lastQuote = await Quote.query()
      .where('quote_number', 'like', `${prefix}%`)
      .orderBy('quote_number', 'desc')
      .first()

    let nextNumber = 1
    if (lastQuote) {
      // NXS-YYYY-XXXXXX
      const lastNumber = parseInt(lastQuote.quoteNumber.split('-').pop() || '0', 10)
      nextNumber = lastNumber + 1
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`
  }

  /**
   * Calculate totals from items
   */
  private calculateTotals(items: { quantity: number; unit_price: number }[], taxRate: number, discountPercent: number = 0) {
    const subtotal = items.reduce((acc, item) => {
      return acc + item.quantity * item.unit_price
    }, 0)

    const discountAmount = subtotal * (discountPercent / 100)
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * (taxRate / 100)
    const total = taxableAmount + taxAmount

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }

  /**
   * GET /api/v1/quotes
   * List all quotes with optional filters
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 25)
    const clientId = request.input('client_id')
    const projectId = request.input('project_id')
    const status = request.input('status')

    const cacheKeyParams = [
      `page:${page}`,
      `per_page:${perPage}`,
      `client_id:${clientId ?? ''}`,
      `project_id:${projectId ?? ''}`,
      `status:${status ?? ''}`,
    ].join(':')

    const cacheKey = `quotes:index:${cacheKeyParams}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = Quote.query()
          .preload('client')
          .preload('project' as any)
          .preload('items')

        // Filter by client
        if (clientId) {
          query = query.where('client_id', clientId)
        }

        // Filter by project
        if (projectId) {
          query = query.where('project_id', projectId)
        }

        // Filter by status
        if (status && ['draft', 'sent', 'approved', 'rejected'].includes(status)) {
          query = query.where('status', status)
        }

        const quotes = await query.orderBy('created_at', 'desc').paginate(page, perPage)

        return {
          data: quotes.all().map((q) => ({
            ...q.serializeForApi(),
            client: q.client?.serializeForApi(),
            project: q.project?.serializeForApi(),
            items: q.items?.map((item) => item.serializeForApi()),
          })),
          meta: {
            total: quotes.total,
            per_page: quotes.perPage,
            current_page: quotes.currentPage,
            last_page: quotes.lastPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    return response.ok(payload)
  }

  /**
   * GET /api/v1/quotes/:id
   * Show a single quote with items
   */
  async show({ params, response }: HttpContext) {
    const quoteId = params.id
    const cacheKey = `quote:${quoteId}:show`

    const quoteData = await CacheService.fetch(
      cacheKey,
      async () => {
        const quote = await Quote.query()
          .where('id', quoteId)
          .preload('client')
          .preload('project' as any)
          .preload('items', (itemsQuery) => {
            itemsQuery.orderBy('sort_order', 'asc')
          })
          .first()

        if (!quote) {
          return null
        }

        return {
          ...quote.serializeForApi(),
          client: quote.client?.serializeForApi(),
          project: quote.project?.serializeForApi(),
          items: quote.items?.map((item) => item.serializeForApi()),
        }
      },
      CACHE_TTL.SHOW
    )

    if (!quoteData) {
      return response.notFound({ error: 'Cotización no encontrada' })
    }

    return response.ok(quoteData)
  }

  /**
   * POST /api/v1/quotes
   * Create a new quote with items (transactional)
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createQuoteValidator)

    // Check if client exists
    const client = await Client.find(data.client_id)
    if (!client) {
      return response.notFound({ error: 'Cliente no encontrado' })
    }

    // Check if project exists (if provided)
    if (data.project_id) {
      const project = await Project.find(data.project_id)
      if (!project) {
        return response.notFound({ error: 'Proyecto no encontrado' })
      }
      // Ensure project belongs to client
      if (project.clientId !== data.client_id) {
        return response.badRequest({ error: 'El proyecto no pertenece al cliente especificado' })
      }
    }

    const taxRate = data.tax_rate ?? 15 // Default 15% IVA
    const discountPercent = data.discount_percent ?? 0
    const { subtotal, discountAmount, taxAmount, total } = this.calculateTotals(data.items, taxRate, discountPercent)

    // Transaction: create quote + items
    const quote = await db.transaction(async (trx) => {
      const quoteNumber = await this.generateQuoteNumber()

      const newQuote = await Quote.create(
        {
          clientId: data.client_id,
          projectId: data.project_id ?? null,
          quoteNumber,
          title: data.title,
          description: data.description ?? null,
          issueDate: DateTime.fromISO(data.issue_date),
          validUntil: DateTime.fromISO(data.valid_until),
          status: 'draft',
          subtotal,
          discountPercent,
          discountAmount,
          taxRate,
          taxAmount,
          total,
          notes: data.notes ?? null,
          termsConditions: data.terms_conditions ?? null,
        },
        { client: trx }
      )

      // Create items
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i]
        const itemSubtotal = item.quantity * item.unit_price

        await QuoteItem.create(
          {
            quoteId: newQuote.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: Math.round(itemSubtotal * 100) / 100,
            paymentType: item.payment_type || 'unico',
            notes: item.notes || null,
            sortOrder: i + 1,
          },
          { client: trx }
        )
      }

      return newQuote
    })

    // Load relations
    await quote.load('client')
      await quote.load('project' as any)
    await quote.load('items')

    await this.invalidateCache(quote.id, data.client_id, data.project_id)

    return response.created({
      ...quote.serializeForApi(),
      client: quote.client?.serializeForApi(),
      project: quote.project?.serializeForApi(),
      items: quote.items?.map((item) => item.serializeForApi()),
    })
  }

  /**
   * PUT /api/v1/quotes/:id
   * Update a quote (only if draft)
   */
  async update({ params, request, response }: HttpContext) {
    const quote = await Quote.find(params.id)

    if (!quote) {
      return response.notFound({ error: 'Cotización no encontrada' })
    }

    const data = await request.validateUsing(updateQuoteValidator)

    // Only allow full edit if draft (status changes are always allowed)
    const onlyStatusChange = Object.keys(data).length === 1 && data.status
    if (!quote.isEditable && !onlyStatusChange) {
      return response.badRequest({
        error: 'Solo se pueden editar cotizaciones en estado borrador',
      })
    }

    // Validate client if changing
    if (data.client_id && data.client_id !== quote.clientId) {
      const client = await Client.find(data.client_id)
      if (!client) {
        return response.notFound({ error: 'Cliente no encontrado' })
      }
    }

    // Validate project if changing
    const effectiveClientId = data.client_id ?? quote.clientId
    if (data.project_id !== undefined) {
      if (data.project_id !== null) {
        const project = await Project.find(data.project_id)
        if (!project) {
          return response.notFound({ error: 'Proyecto no encontrado' })
        }
        if (project.clientId !== effectiveClientId) {
          return response.badRequest({ error: 'El proyecto no pertenece al cliente especificado' })
        }
      }
    }

    // Transaction: update quote + items
    await db.transaction(async (trx) => {
      const taxRate = data.tax_rate ?? quote.taxRate
      const discountPercent = data.discount_percent ?? quote.discountPercent

      // Recalculate totals if items provided
      if (data.items && data.items.length > 0) {
        const { subtotal, discountAmount, taxAmount, total } = this.calculateTotals(data.items, taxRate, discountPercent)

        quote.merge({
          clientId: data.client_id ?? quote.clientId,
          projectId: data.project_id !== undefined ? data.project_id : quote.projectId,
          title: data.title ?? quote.title,
          description: data.description !== undefined ? data.description : quote.description,
          issueDate: data.issue_date ? DateTime.fromISO(data.issue_date) : quote.issueDate,
          validUntil: data.valid_until ? DateTime.fromISO(data.valid_until) : quote.validUntil,
          status: (data.status as 'draft' | 'sent' | 'approved' | 'rejected') ?? quote.status,
          subtotal,
          discountPercent,
          discountAmount,
          taxRate,
          taxAmount,
          total,
          notes: data.notes !== undefined ? data.notes : quote.notes,
          termsConditions: data.terms_conditions !== undefined ? data.terms_conditions : quote.termsConditions,
        })

        await quote.useTransaction(trx).save()

        // Delete old items
        await QuoteItem.query({ client: trx }).where('quote_id', quote.id).delete()

        // Create new items
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i]
          const itemSubtotal = item.quantity * item.unit_price

          await QuoteItem.create(
            {
              quoteId: quote.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              subtotal: Math.round(itemSubtotal * 100) / 100,
              paymentType: item.payment_type || 'unico',
              notes: item.notes || null,
              sortOrder: i + 1,
            },
            { client: trx }
          )
        }
      } else {
        // Just update quote fields (no items change)
        const updateData: Record<string, unknown> = {}

        if (data.client_id !== undefined) updateData.clientId = data.client_id
        if (data.project_id !== undefined) updateData.projectId = data.project_id
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.issue_date !== undefined) updateData.issueDate = DateTime.fromISO(data.issue_date)
        if (data.valid_until !== undefined)
          updateData.validUntil = DateTime.fromISO(data.valid_until)
        if (data.status !== undefined) updateData.status = data.status
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.terms_conditions !== undefined) updateData.termsConditions = data.terms_conditions

        // Recalculate if tax rate or discount changed
        const effectiveDiscountPercent = data.discount_percent ?? quote.discountPercent
        const effectiveTaxRate = data.tax_rate ?? quote.taxRate
        
        if (data.tax_rate !== undefined || data.discount_percent !== undefined) {
          const discountAmount = quote.subtotal * (effectiveDiscountPercent / 100)
          const taxableAmount = quote.subtotal - discountAmount
          const taxAmount = taxableAmount * (effectiveTaxRate / 100)
          
          updateData.discountPercent = effectiveDiscountPercent
          updateData.discountAmount = Math.round(discountAmount * 100) / 100
          updateData.taxRate = effectiveTaxRate
          updateData.taxAmount = Math.round(taxAmount * 100) / 100
          updateData.total = Math.round((taxableAmount + taxAmount) * 100) / 100
        }

        quote.merge(updateData)
        await quote.useTransaction(trx).save()
      }
    })

    // Reload with relations
    await quote.load('client')
      await quote.load('project' as any)
    await quote.load('items')

    await this.invalidateCache(quote.id, quote.clientId, quote.projectId)

    return response.ok({
      ...quote.serializeForApi(),
      client: quote.client?.serializeForApi(),
      project: quote.project?.serializeForApi(),
      items: quote.items?.map((item) => item.serializeForApi()),
    })
  }

  /**
   * DELETE /api/v1/quotes/:id
   * Delete a quote (only if draft)
   */
  async destroy({ params, response }: HttpContext) {
    const quote = await Quote.find(params.id)

    if (!quote) {
      return response.notFound({ error: 'Cotización no encontrada' })
    }

    if (!quote.isEditable) {
      return response.badRequest({
        error: 'Solo se pueden eliminar cotizaciones en estado borrador',
      })
    }

    const clientId = quote.clientId
    const projectId = quote.projectId

    // Items will be deleted by CASCADE
    await quote.delete()

    await this.invalidateCache(params.id, clientId, projectId)

    return response.ok({ message: 'Cotización eliminada exitosamente' })
  }

  /**
   * PATCH /api/v1/quotes/:id/status
   * Change quote status
   */
  async updateStatus({ params, request, response }: HttpContext) {
    const quote = await Quote.find(params.id)

    if (!quote) {
      return response.notFound({ error: 'Cotización no encontrada' })
    }

    const { status } = request.only(['status'])

    if (!status || !['draft', 'sent', 'approved', 'rejected'].includes(status)) {
      return response.badRequest({ error: 'Estado inválido' })
    }

    // Status transition rules
    const allowedTransitions: Record<string, string[]> = {
      draft: ['sent'],
      sent: ['approved', 'rejected', 'draft'],
      approved: [], // Final state
      rejected: ['draft'], // Can revert to draft to edit
    }

    if (!allowedTransitions[quote.status]?.includes(status)) {
      return response.badRequest({
        error: `No se puede cambiar de '${quote.statusLabel}' a '${status}'`,
      })
    }

    quote.status = status
    await quote.save()

    // Si el estado cambia a 'approved', crear factura automáticamente
    let createdInvoice = null
    if (status === 'approved') {
      try {
        const invoiceService = new InvoiceService()
        const invoice = await invoiceService.createFromQuote(quote.id, 30)
        await invoice.load('items')
        await invoice.load('client')
        createdInvoice = {
          ...invoice.serializeForApi(),
          client: invoice.client?.serializeForApi(),
          items: invoice.items?.map((item) => item.serializeForApi()),
        }
        
        // Invalidar cache de invoices también
        await CacheService.deleteMatched('invoices:*')
      } catch (error) {
        // Si ya existe una factura, no es un error crítico
        console.warn('No se pudo crear factura automáticamente:', (error as Error).message)
      }
    }

    await quote.load('client')
    await quote.load('project' as any)
    await quote.load('items')

    await this.invalidateCache(quote.id, quote.clientId, quote.projectId)

    return response.ok({
      ...quote.serializeForApi(),
      client: quote.client?.serializeForApi(),
      project: quote.project?.serializeForApi(),
      items: quote.items?.map((item) => item.serializeForApi()),
      created_invoice: createdInvoice,
    })
  }

  /**
   * POST /api/v1/quotes/:id/duplicate
   * Duplicate a quote as new draft
   */
  async duplicate({ params, response }: HttpContext) {
    const originalQuote = await Quote.query()
      .where('id', params.id)
      .preload('items')
      .first()

    if (!originalQuote) {
      return response.notFound({ error: 'Cotización no encontrada' })
    }

    const newQuote = await db.transaction(async (trx) => {
      const quoteNumber = await this.generateQuoteNumber()

      const quote = await Quote.create(
        {
          clientId: originalQuote.clientId,
          projectId: originalQuote.projectId,
          quoteNumber,
          title: `${originalQuote.title} (copia)`,
          issueDate: DateTime.now(),
          validUntil: DateTime.now().plus({ days: 30 }),
          status: 'draft',
          subtotal: originalQuote.subtotal,
          taxRate: originalQuote.taxRate,
          taxAmount: originalQuote.taxAmount,
          total: originalQuote.total,
          notes: originalQuote.notes,
        },
        { client: trx }
      )

      // Copy items
      for (const item of originalQuote.items) {
        await QuoteItem.create(
          {
            quoteId: quote.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            sortOrder: item.sortOrder,
          },
          { client: trx }
        )
      }

      return quote
    })

    await newQuote.load('client')
      await newQuote.load('project' as any)
    await newQuote.load('items')

    await this.invalidateCache(newQuote.id, newQuote.clientId, newQuote.projectId)

    return response.created({
      ...newQuote.serializeForApi(),
      client: newQuote.client?.serializeForApi(),
      project: newQuote.project?.serializeForApi(),
      items: newQuote.items?.map((item) => item.serializeForApi()),
    })
  }

  /**
   * Invalidate relevant caches
   */
  private async invalidateCache(
    quoteId: number,
    clientId?: number | null,
    projectId?: number | null
  ) {
    await CacheService.deleteMatched('quotes:index:*')
    await CacheService.delete(`quote:${quoteId}:show`)

    if (clientId) {
      await CacheService.deleteMatched(`client:${clientId}:*`)
    }

    if (projectId) {
      await CacheService.deleteMatched(`project:${projectId}:*`)
    }
  }
}