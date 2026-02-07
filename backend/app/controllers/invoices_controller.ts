import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import InvoiceService from '#services/invoice_service'
import CacheService from '#services/cache_service'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import {
  createInvoiceValidator,
  updateInvoiceValidator,
  convertFromQuoteValidator,
  markAsPaidValidator,
  registerPaymentValidator,
} from '#validators/invoice'

// Cache TTLs (seconds)
const CACHE_TTL = {
  INDEX: 300,
  SHOW: 600,
}

export default class InvoicesController {
  private invoiceService = new InvoiceService()

  /**
   * Calculate totals from items
   */
  private calculateTotals(items: { quantity: number; unit_price: number; discount_percent?: number }[], taxRate: number) {
    const subtotal = items.reduce((acc, item) => {
      const gross = item.quantity * item.unit_price
      const itemDiscount = gross * ((item.discount_percent || 0) / 100)
      return acc + (gross - itemDiscount)
    }, 0)

    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }

  /**
   * GET /api/v1/invoices
   * List all invoices with optional filters
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

    const cacheKey = `invoices:index:${cacheKeyParams}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        let query = Invoice.query()
          .preload('client')
          .preload('project' as any)
          .preload('items')
          .preload('quote' as any)
          .preload('recurringService' as any)

        // Filter by client
        if (clientId) {
          query = query.where('client_id', clientId)
        }

        // Filter by project
        if (projectId) {
          query = query.where('project_id', projectId)
        }

        // Filter by status
        if (status && ['pending', 'partial', 'paid', 'overdue', 'voided'].includes(status)) {
          query = query.where('status', status)
        }

        const invoices = await query.orderBy('created_at', 'desc').paginate(page, perPage)

        return {
          data: invoices.all().map((inv) => ({
            ...inv.serializeForApi(),
            client: inv.client?.serializeForApi(),
            project: inv.project?.serializeForApi(),
            items: inv.items?.map((item) => item.serializeForApi()),
            quote: inv.quote ? { id: inv.quote.id, quote_number: inv.quote.quoteNumber } : null,
            recurring_service: inv.recurringService
              ? { id: inv.recurringService.id, name: inv.recurringService.name }
              : null,
          })),
          meta: {
            total: invoices.total,
            per_page: invoices.perPage,
            current_page: invoices.currentPage,
            last_page: invoices.lastPage,
          },
        }
      },
      CACHE_TTL.INDEX
    )

    return response.ok(payload)
  }

  /**
   * GET /api/v1/invoices/:id
   * Show single invoice with full details
   */
  async show({ params, response }: HttpContext) {
    const cacheKey = `invoices:show:${params.id}`

    const payload = await CacheService.fetch(
      cacheKey,
      async () => {
        const invoice = await Invoice.query()
          .where('id', params.id)
          .preload('client')
          .preload('project' as any)
          .preload('items', (query) => query.orderBy('sort_order', 'asc'))
          .preload('payments', (query) => query.orderBy('payment_date', 'desc'))
          .preload('quote' as any)
          .preload('recurringService' as any)
          .firstOrFail()

        return {
          ...invoice.serializeForApi(),
          client: invoice.client?.serializeForApi(),
          project: invoice.project?.serializeForApi(),
          items: invoice.items?.map((item) => item.serializeForApi()),
          payments: invoice.payments?.map((payment) => payment.serializeForApi()),
          quote: invoice.quote
            ? { id: invoice.quote.id, quote_number: invoice.quote.quoteNumber, title: invoice.quote.title }
            : null,
          recurring_service: invoice.recurringService
            ? { id: invoice.recurringService.id, name: invoice.recurringService.name }
            : null,
        }
      },
      CACHE_TTL.SHOW
    )

    return response.ok(payload)
  }

  /**
   * POST /api/v1/invoices
   * Create manual invoice
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createInvoiceValidator)
    const taxRate = data.tax_rate ?? 15
    const { subtotal, taxAmount, total } = this.calculateTotals(data.items, taxRate)

    const invoice = await db.transaction(async (trx) => {
      const invoiceNumber = await this.invoiceService.generateInvoiceNumber()

      const newInvoice = await Invoice.create(
        {
          clientId: data.client_id,
          projectId: data.project_id || null,
          quoteId: null,
          recurringServiceId: null,
          invoiceNumber,
          issueDate: DateTime.fromISO(data.issue_date),
          dueDate: DateTime.fromISO(data.due_date),
          status: 'pending',
          subtotal,
          taxRate,
          taxAmount,
          total,
          totalPaid: 0,
          balanceDue: total,
          notes: data.notes || null,
          termsConditions: data.terms_conditions || null,
        },
        { client: trx }
      )

      // Create items
      for (const [index, itemData] of data.items.entries()) {
        const itemDiscountPercent = itemData.discount_percent ?? 0
        const gross = itemData.quantity * itemData.unit_price
        const itemSubtotal = gross - (gross * (itemDiscountPercent / 100))
        await InvoiceItem.create(
          {
            invoiceId: newInvoice.id,
            description: itemData.description,
            quantity: itemData.quantity,
            unitPrice: itemData.unit_price,
            discountPercent: itemDiscountPercent,
            subtotal: Math.round(itemSubtotal * 100) / 100,
            paymentType: itemData.payment_type || 'unico',
            notes: itemData.notes || null,
            sortOrder: index,
          },
          { client: trx }
        )
      }

      return newInvoice
    })

    // Invalidate cache
    await CacheService.deleteMatched('invoices:*')

    // Load relations for response
    await invoice.load('client')
      await invoice.load('project' as any)
    await invoice.load('items')

    return response.created({
      ...invoice.serializeForApi(),
      client: invoice.client?.serializeForApi(),
      project: invoice.project?.serializeForApi(),
      items: invoice.items?.map((item) => item.serializeForApi()),
    })
  }

  /**
   * PUT /api/v1/invoices/:id
   * Update invoice (only pending invoices)
   */
  async update({ params, request, response }: HttpContext) {
    const invoice = await Invoice.findOrFail(params.id)

    if (!invoice.isEditable) {
      return response.forbidden({
        message: 'Solo se pueden editar facturas pendientes',
      })
    }

    const data = await request.validateUsing(updateInvoiceValidator)

    await db.transaction(async (trx) => {
      invoice.useTransaction(trx)

      // Update basic fields
      if (data.issue_date) {
        invoice.issueDate = DateTime.fromISO(data.issue_date)
      }
      if (data.due_date) {
        invoice.dueDate = DateTime.fromISO(data.due_date)
      }
      if (data.tax_rate !== undefined) {
        invoice.taxRate = data.tax_rate
      }
      if (data.notes !== undefined) {
        invoice.notes = data.notes || null
      }
      if (data.terms_conditions !== undefined) {
        // If empty string, set to null
        invoice.termsConditions = data.terms_conditions || null
      }

      // Update items if provided
      if (data.items) {
        // Delete existing items
        await InvoiceItem.query({ client: trx }).where('invoice_id', invoice.id).delete()

        // Create new items
        for (const [index, itemData] of data.items.entries()) {
          const itemDiscountPercent = itemData.discount_percent ?? 0
          const gross = itemData.quantity * itemData.unit_price
          const itemSubtotal = gross - (gross * (itemDiscountPercent / 100))
          await InvoiceItem.create(
            {
              invoiceId: invoice.id,
              description: itemData.description,
              quantity: itemData.quantity,
              unitPrice: itemData.unit_price,
              discountPercent: itemDiscountPercent,
              subtotal: Math.round(itemSubtotal * 100) / 100,
              paymentType: itemData.payment_type || 'unico',
              notes: itemData.notes || null,
              sortOrder: index,
            },
            { client: trx }
          )
        }

        // Recalculate totals
        const { subtotal, taxAmount, total } = this.calculateTotals(data.items, invoice.taxRate)
        invoice.subtotal = subtotal
        invoice.taxAmount = taxAmount
        invoice.total = total
      }

      await invoice.save()
    })

    // Invalidate cache
    await CacheService.deleteMatched('invoices:*')

    // Load relations for response
    await invoice.load('client')
      await invoice.load('project' as any)
    await invoice.load('items')

    return response.ok({
      ...invoice.serializeForApi(),
      client: invoice.client?.serializeForApi(),
      project: invoice.project?.serializeForApi(),
      items: invoice.items?.map((item) => item.serializeForApi()),
    })
  }

  /**
   * DELETE /api/v1/invoices/:id
   * Delete invoice (only pending invoices)
   */
  async destroy({ params, response }: HttpContext) {
    const invoice = await Invoice.findOrFail(params.id)

    if (!invoice.isEditable) {
      return response.forbidden({
        message: 'Solo se pueden eliminar facturas pendientes',
      })
    }

    await invoice.delete()

    // Invalidate cache
    await CacheService.deleteMatched('invoices:*')

    return response.noContent()
  }

  /**
   * POST /api/v1/invoices/from-quote
   * Create invoice from approved quote
   */
  async convertFromQuote({ request, response }: HttpContext) {
    const data = await request.validateUsing(convertFromQuoteValidator)

    try {
      const invoice = await this.invoiceService.createFromQuote(data.quote_id, data.due_days ?? 30)

      // Invalidate cache
      await CacheService.deleteMatched('invoices:*')
      await CacheService.deleteMatched('quotes:*')

      // Load relations
      await invoice.load('client')
        await invoice.load('project' as any)
      await invoice.load('items')

      return response.created({
        ...invoice.serializeForApi(),
        client: invoice.client?.serializeForApi(),
        project: invoice.project?.serializeForApi(),
        items: invoice.items?.map((item) => item.serializeForApi()),
      })
    } catch (error) {
      return response.badRequest({
        message: (error as Error).message,
      })
    }
  }

  /**
   * POST /api/v1/invoices/:id/mark-paid
   * Mark invoice as paid
   */
  async markAsPaid({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(markAsPaidValidator)

    try {
      const invoice = await this.invoiceService.markAsPaid(
        params.id,
        data.payment_method,
        data.payment_notes
      )

      // Invalidate cache
      await CacheService.deleteMatched('invoices:*')

      // Load relations
      await invoice.load('client')
        await invoice.load('project' as any)
      await invoice.load('items')

      return response.ok({
        ...invoice.serializeForApi(),
        client: invoice.client?.serializeForApi(),
        project: invoice.project?.serializeForApi(),
        items: invoice.items?.map((item) => item.serializeForApi()),
      })
    } catch (error) {
      return response.badRequest({
        message: (error as Error).message,
      })
    }
  }

  /**
   * POST /api/v1/invoices/:id/void
   * Void an invoice (anular)
   */
  async voidInvoice({ params, response }: HttpContext) {
    try {
      const invoice = await this.invoiceService.voidInvoice(params.id)

      // Invalidate cache
      await CacheService.deleteMatched('invoices:*')

      // Load relations
      await invoice.load('client')
        await invoice.load('project' as any)
      await invoice.load('items')

      return response.ok({
        ...invoice.serializeForApi(),
        client: invoice.client?.serializeForApi(),
        project: invoice.project?.serializeForApi(),
        items: invoice.items?.map((item) => item.serializeForApi()),
      })
    } catch (error) {
      return response.badRequest({
        message: (error as Error).message,
      })
    }
  }

  /**
   * GET /api/v1/invoices/stats
   * Get invoice statistics
   */
  async stats({ response }: HttpContext) {
    const cacheKey = 'invoices:stats'

    const stats = await CacheService.fetch(
      cacheKey,
      async () => {
        const [pending, partial, paid, overdue, voided] = await Promise.all([
          Invoice.query().where('status', 'pending'),
          Invoice.query().where('status', 'partial'),
          Invoice.query().where('status', 'paid'),
          Invoice.query()
            .whereIn('status', ['pending', 'partial'])
            .where('due_date', '<', DateTime.now().toSQLDate()),
          Invoice.query().where('status', 'voided'),
        ])

        const pendingTotal = pending.reduce((sum, inv) => sum + Number(inv.balanceDue || inv.total), 0)
        const partialTotal = partial.reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0)
        const paidTotal = paid.reduce((sum, inv) => sum + Number(inv.total), 0)
        const overdueTotal = overdue.reduce((sum, inv) => sum + Number(inv.balanceDue || inv.total), 0)

        return {
          pending_count: pending.length,
          pending_total: pendingTotal,
          partial_count: partial.length,
          partial_total: partialTotal,
          paid_count: paid.length,
          paid_total: paidTotal,
          overdue_count: overdue.length,
          overdue_total: overdueTotal,
          voided_count: voided.length,
        }
      },
      300 // 5 minutes
    )

    return response.ok(stats)
  }

  /**
   * POST /api/v1/invoices/:id/payments
   * Register a payment (partial or full)
   */
  async registerPayment({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(registerPaymentValidator)

    try {
      const paymentDate = data.payment_date 
        ? DateTime.fromISO(data.payment_date) 
        : DateTime.now()

      const { invoice, payment } = await this.invoiceService.registerPayment(
        params.id,
        {
          amount: data.amount,
          paymentDate,
          paymentMethod: data.payment_method,
          notes: data.notes,
        }
      )

      // Invalidate cache
      await CacheService.deleteMatched('invoices:*')

      // Load relations
      await invoice.load('client')
      await invoice.load('project' as any)
      await invoice.load('items')
      await invoice.load('payments')

      return response.ok({
        invoice: {
          ...invoice.serializeForApi(),
          client: invoice.client?.serializeForApi(),
          project: invoice.project?.serializeForApi(),
          items: invoice.items?.map((item) => item.serializeForApi()),
          payments: invoice.payments?.map((p) => p.serializeForApi()),
        },
        payment: payment.serializeForApi(),
      })
    } catch (error) {
      return response.badRequest({
        message: (error as Error).message,
      })
    }
  }

  /**
   * GET /api/v1/invoices/:id/payments
   * Get all payments for an invoice
   */
  async getPayments({ params, response }: HttpContext) {
    const payments = await this.invoiceService.getPayments(params.id)

    return response.ok({
      data: payments.map((payment) => payment.serializeForApi()),
    })
  }

  /**
   * DELETE /api/v1/invoices/:id/payments/:paymentId
   * Delete a payment
   */
  async deletePayment({ params, response }: HttpContext) {
    try {
      const invoice = await this.invoiceService.deletePayment(params.paymentId)

      // Invalidate cache
      await CacheService.deleteMatched('invoices:*')

      // Load relations
      await invoice.load('client')
      await invoice.load('project' as any)
      await invoice.load('items')
      await invoice.load('payments')

      return response.ok({
        ...invoice.serializeForApi(),
        client: invoice.client?.serializeForApi(),
        project: invoice.project?.serializeForApi(),
        items: invoice.items?.map((item) => item.serializeForApi()),
        payments: invoice.payments?.map((p) => p.serializeForApi()),
      })
    } catch (error) {
      return response.badRequest({
        message: (error as Error).message,
      })
    }
  }

  // ========================================
  // SRI Ecuador - Electronic Billing
  // ========================================

  /**
   * POST /api/v1/invoices/:id/sri/process
   * Process an invoice through SRI electronic billing
   */
  async processSri({ params, response }: HttpContext) {
    try {
      const SriService = (await import('#services/sri_service')).default
      const sriService = await SriService.fromBusiness()

      // Validate SRI configuration
      const validation = sriService.validateConfig()
      if (!validation.valid) {
        return response.badRequest({
          message: 'Configuración SRI incompleta',
          errors: validation.errors,
        })
      }

      // Load invoice with relations
      const invoice = await Invoice.query()
        .where('id', params.id)
        .preload('client')
        .preload('items')
        .firstOrFail()

      // Check if already processed
      if (invoice.sriStatus === 'authorized') {
        return response.badRequest({
          message: 'Esta factura ya está autorizada por el SRI',
          access_key: invoice.accessKey,
        })
      }

      // Process through SRI
      const result = await sriService.processInvoice(invoice)

      // Invalidate cache
      await CacheService.deleteMatched('invoices:*')

      if (result.success) {
        return response.ok({
          message: 'Factura autorizada por el SRI',
          access_key: result.accessKey,
          status: result.status,
          invoice: invoice.serializeForApi(),
        })
      } else {
        return response.ok({
          message: 'Factura enviada al SRI pero pendiente de autorización',
          access_key: result.accessKey,
          status: result.status,
          sri_messages: result.messages,
          invoice: invoice.serializeForApi(),
        })
      }
    } catch (error) {
      return response.internalServerError({
        message: 'Error al procesar factura en SRI',
        error: (error as Error).message,
      })
    }
  }

  /**
   * GET /api/v1/invoices/:id/sri/status
   * Check SRI authorization status for an invoice
   */
  async checkSriStatus({ params, response }: HttpContext) {
    try {
      const invoice = await Invoice.findOrFail(params.id)

      if (!invoice.accessKey) {
        return response.badRequest({
          message: 'Esta factura no ha sido enviada al SRI',
        })
      }

      const SriService = (await import('#services/sri_service')).default
      const sriService = await SriService.fromBusiness()

      const result = await sriService.authorize(invoice.accessKey)

      // Update invoice if now authorized
      if (result.success && invoice.sriStatus !== 'authorized') {
        invoice.sriStatus = 'authorized'
        invoice.authorizationDate = result.fechaAutorizacion
          ? DateTime.fromFormat(result.fechaAutorizacion, 'dd/MM/yyyy HH:mm:ss')
          : DateTime.now()
        await invoice.save()
        await CacheService.deleteMatched('invoices:*')
      }

      return response.ok({
        access_key: invoice.accessKey,
        status: invoice.sriStatus,
        authorization_date: invoice.authorizationDate?.toISO(),
        sri_response: result,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al consultar estado en SRI',
        error: (error as Error).message,
      })
    }
  }

  /**
   * GET /api/v1/invoices/:id/sri/xml
   * Download signed XML for an invoice
   */
  async downloadSriXml({ params, response }: HttpContext) {
    const invoice = await Invoice.findOrFail(params.id)

    if (!invoice.xmlContent) {
      return response.badRequest({
        message: 'Esta factura no tiene XML firmado',
      })
    }

    response.header('Content-Type', 'application/xml')
    response.header('Content-Disposition', `attachment; filename="factura-${invoice.accessKey || invoice.invoiceNumber}.xml"`)

    return response.send(invoice.xmlContent)
  }

  /**
   * POST /api/v1/invoices/:id/sri/generate-xml
   * Generate XML without sending to SRI (for testing)
   */
  async generateSriXml({ params, response }: HttpContext) {
    try {
      const SriService = (await import('#services/sri_service')).default
      const sriService = await SriService.fromBusiness()

      const invoice = await Invoice.query()
        .where('id', params.id)
        .preload('client')
        .preload('items')
        .firstOrFail()

      const accessKey = sriService.generateAccessKey(invoice)
      const xml = await sriService.generateXml(invoice, accessKey)

      return response.ok({
        access_key: accessKey,
        xml: xml,
        message: 'XML generado (sin firmar ni enviar)',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al generar XML',
        error: (error as Error).message,
      })
    }
  }

  /**
   * GET /api/v1/sri/config
   * Get current SRI configuration status
   */
  async getSriConfig({ response }: HttpContext) {
    try {
      const SriService = (await import('#services/sri_service')).default
      const sriService = await SriService.fromBusiness()
      const validation = sriService.validateConfig()

      const Business = (await import('#models/business')).default
      const business = await Business.current()

      return response.ok({
        configured: validation.valid,
        errors: validation.errors,
        environment: business.sriAmbiente === '1' ? 'Pruebas' : 'Producción',
        ruc: business.ruc,
        razon_social: business.razonSocial,
        nombre_comercial: business.nombreComercial,
        serie: business.sriSerie,
        ultimo_secuencial: business.ultimoSecuencialFactura,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al obtener configuración SRI',
        error: (error as Error).message,
      })
    }
  }
}

