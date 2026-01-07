import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import Quote from '#models/quote'
import RecurringService from '#models/recurring_service'

export default class InvoiceService {
  /**
   * Generate unique invoice number: FAC-YYYY-XXXXXX
   * Yearly sequential format with 6-digit sequence
   */
  async generateInvoiceNumber(): Promise<string> {
    const year = DateTime.now().year
    const prefix = `FAC-${year}-`

    // Find the last invoice with this year's prefix
    const lastInvoice = await Invoice.query()
      .where('invoice_number', 'like', `${prefix}%`)
      .orderBy('invoice_number', 'desc')
      .first()

    let nextSequence = 1

    if (lastInvoice) {
      // Extract the sequence number from the last invoice
      const lastNumber = lastInvoice.invoiceNumber.replace(prefix, '')
      const lastSequence = parseInt(lastNumber, 10)
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1
      }
    }

    // Format with 6 digits: FAC-2026-000001
    return `${prefix}${String(nextSequence).padStart(6, '0')}`
  }

  /**
   * Create invoice from approved quote
   * Copies all items and totals from the quote
   */
  async createFromQuote(quoteId: number, dueDays: number = 30): Promise<Invoice> {
    // Load quote with items and client
    const quote = await Quote.query()
      .where('id', quoteId)
      .preload('items')
      .preload('client')
      .firstOrFail()

    // Validate quote is approved
    if (quote.status !== 'approved') {
      throw new Error('Solo se pueden convertir cotizaciones aprobadas')
    }

    // Check if quote already has an invoice
    const existingInvoice = await Invoice.query()
      .where('quote_id', quoteId)
      .first()

    if (existingInvoice) {
      throw new Error('Esta cotización ya tiene una factura asociada')
    }

    // Create invoice in transaction
    return await db.transaction(async (trx) => {
      const invoiceNumber = await this.generateInvoiceNumber()
      const issueDate = DateTime.now()
      const dueDate = issueDate.plus({ days: dueDays })

      // Create invoice
      const invoice = await Invoice.create(
        {
          clientId: quote.clientId,
          projectId: quote.projectId,
          quoteId: quote.id,
          recurringServiceId: null,
          invoiceNumber,
          issueDate,
          dueDate,
          status: 'pending',
          subtotal: quote.subtotal,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes,
        },
        { client: trx }
      )

      // Copy items from quote
      for (const [index, quoteItem] of quote.items.entries()) {
        await InvoiceItem.create(
          {
            invoiceId: invoice.id,
            description: quoteItem.description,
            quantity: quoteItem.quantity,
            unitPrice: quoteItem.unitPrice,
            subtotal: quoteItem.subtotal,
            sortOrder: index,
          },
          { client: trx }
        )
      }

      return invoice
    })
  }

  /**
   * Create invoice from recurring service
   * Creates a single item invoice for the service amount
   */
  async createFromRecurringService(
    recurringServiceId: number,
    dueDays: number = 15
  ): Promise<Invoice> {
    // Load service with project and client
    const service = await RecurringService.query()
      .where('id', recurringServiceId)
      .preload('project' as any, (query: any) => query.preload('client'))
      .firstOrFail()

    // Validate service is active
    if (service.status !== 'active') {
      throw new Error('El servicio recurrente no está activo')
    }

    // Create invoice in transaction
    return await db.transaction(async (trx) => {
      const invoiceNumber = await this.generateInvoiceNumber()
      const issueDate = DateTime.now()
      const dueDate = issueDate.plus({ days: dueDays })

      // Auto-generated invoices from recurring services have 0% tax (IVA exento)
      // User can manually edit if tax is needed
      const taxRate = 0
      const subtotal = Number(service.amount)
      const taxAmount = 0
      const total = subtotal

      // Build description with billing period
      const billingPeriod =
        service.billingCycle === 'monthly'
          ? issueDate.toFormat('MMMM yyyy', { locale: 'es' })
          : issueDate.toFormat('yyyy')

      const description = `${service.name} - ${billingPeriod}`

      // Create invoice
      const invoice = await Invoice.create(
        {
          clientId: service.project.clientId,
          projectId: service.projectId,
          quoteId: null,
          recurringServiceId: service.id,
          invoiceNumber,
          issueDate,
          dueDate,
          status: 'pending',
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: service.description,
        },
        { client: trx }
      )

      // Create single item for the service
      await InvoiceItem.create(
        {
          invoiceId: invoice.id,
          description,
          quantity: 1,
          unitPrice: subtotal,
          subtotal,
          sortOrder: 0,
        },
        { client: trx }
      )

      // Update next billing date
      const nextDate =
        service.billingCycle === 'monthly'
          ? service.nextBillingDate.plus({ months: 1 })
          : service.nextBillingDate.plus({ years: 1 })

      service.useTransaction(trx)
      service.nextBillingDate = nextDate
      await service.save()

      return invoice
    })
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(
    invoiceId: number,
    paymentMethod: 'transfer' | 'cash' | 'card' | 'other',
    paymentNotes?: string
  ): Promise<Invoice> {
    const invoice = await Invoice.findOrFail(invoiceId)

    // Idempotente: si ya está pagada, devolvemos sin error
    if (invoice.status === 'paid') {
      return invoice
    }

    if (invoice.status === 'voided') {
      throw new Error('No se puede marcar como pagada una factura anulada')
    }

    invoice.status = 'paid'
    invoice.paymentDate = DateTime.now()
    invoice.paymentMethod = paymentMethod
    invoice.paymentNotes = paymentNotes || null

    await invoice.save()
    return invoice
  }

  /**
   * Void an invoice (anular)
   */
  async voidInvoice(invoiceId: number): Promise<Invoice> {
    const invoice = await Invoice.findOrFail(invoiceId)

    if (invoice.status === 'paid') {
      throw new Error('No se puede anular una factura pagada')
    }

    // Idempotente: si ya está anulada, devolvemos la factura sin error
    if (invoice.status === 'voided') {
      return invoice
    }

    invoice.status = 'voided'
    await invoice.save()
    return invoice
  }

  /**
   * Calculate and update invoice totals from items
   */
  async recalculateTotals(invoice: Invoice): Promise<Invoice> {
    const items = await InvoiceItem.query().where('invoice_id', invoice.id)

    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    const taxAmount = subtotal * (Number(invoice.taxRate) / 100)
    const total = subtotal + taxAmount

    invoice.subtotal = subtotal
    invoice.taxAmount = taxAmount
    invoice.total = total

    await invoice.save()
    return invoice
  }
}
