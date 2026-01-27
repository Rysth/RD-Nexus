import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import InvoicePayment from '#models/invoice_payment'
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
          totalPaid: 0,
          balanceDue: quote.total,
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
          totalPaid: 0,
          balanceDue: total,
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
   * Mark invoice as paid (legacy method - marks full payment)
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

    // Register the remaining balance as a single payment
    const balanceDue = Number(invoice.balanceDue) || Number(invoice.total)
    
    await this.registerPayment(invoiceId, {
      amount: balanceDue,
      paymentDate: DateTime.now(),
      paymentMethod,
      notes: paymentNotes,
    })

    // Reload and return the invoice
    return await Invoice.findOrFail(invoiceId)
  }

  /**
   * Register a payment (partial or full)
   */
  async registerPayment(
    invoiceId: number,
    data: {
      amount: number
      paymentDate: DateTime
      paymentMethod: 'transfer' | 'cash' | 'card' | 'other'
      notes?: string
    }
  ): Promise<{ invoice: Invoice; payment: InvoicePayment }> {
    const invoice = await Invoice.findOrFail(invoiceId)

    if (invoice.status === 'voided') {
      throw new Error('No se puede registrar pago en una factura anulada')
    }

    if (invoice.status === 'paid') {
      throw new Error('Esta factura ya está completamente pagada')
    }

    const currentBalance = Number(invoice.balanceDue) || Number(invoice.total)
    const paymentAmount = Math.round(data.amount * 100) / 100

    if (paymentAmount > currentBalance) {
      throw new Error(`El monto del pago ($${paymentAmount}) excede el saldo pendiente ($${currentBalance})`)
    }

    return await db.transaction(async (trx) => {
      // Create the payment record
      const payment = await InvoicePayment.create(
        {
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
        },
        { client: trx }
      )

      // Update invoice totals
      const newTotalPaid = Math.round((Number(invoice.totalPaid || 0) + paymentAmount) * 100) / 100
      const newBalanceDue = Math.round((Number(invoice.total) - newTotalPaid) * 100) / 100

      invoice.useTransaction(trx)
      invoice.totalPaid = newTotalPaid
      invoice.balanceDue = newBalanceDue

      // Update status based on payment
      if (newBalanceDue <= 0) {
        invoice.status = 'paid'
        invoice.paymentDate = data.paymentDate
        invoice.paymentMethod = data.paymentMethod
        invoice.paymentNotes = data.notes || null
      } else if (newTotalPaid > 0) {
        invoice.status = 'partial'
        // Keep track of the last payment method
        invoice.paymentMethod = data.paymentMethod
      }

      await invoice.save()

      return { invoice, payment }
    })
  }

  /**
   * Delete a payment and recalculate invoice totals
   */
  async deletePayment(paymentId: number): Promise<Invoice> {
    const payment = await InvoicePayment.query()
      .where('id', paymentId)
      .preload('invoice' as any)
      .firstOrFail()

    const invoice = payment.invoice

    if (invoice.status === 'voided') {
      throw new Error('No se pueden modificar pagos de una factura anulada')
    }

    return await db.transaction(async (trx) => {
      // Delete the payment
      payment.useTransaction(trx)
      await payment.delete()

      // Recalculate totals
      const remainingPayments = await InvoicePayment.query({ client: trx })
        .where('invoice_id', invoice.id)
        .orderBy('payment_date', 'desc')

      const newTotalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const newBalanceDue = Math.round((Number(invoice.total) - newTotalPaid) * 100) / 100

      invoice.useTransaction(trx)
      invoice.totalPaid = Math.round(newTotalPaid * 100) / 100
      invoice.balanceDue = newBalanceDue

      // Update status
      if (newTotalPaid <= 0) {
        invoice.status = 'pending'
        invoice.paymentDate = null
        invoice.paymentMethod = null
        invoice.paymentNotes = null
      } else if (newBalanceDue > 0) {
        invoice.status = 'partial'
        // Update payment info from last payment
        if (remainingPayments.length > 0) {
          invoice.paymentMethod = remainingPayments[0].paymentMethod
        }
      }

      await invoice.save()
      return invoice
    })
  }

  /**
   * Get all payments for an invoice
   */
  async getPayments(invoiceId: number): Promise<InvoicePayment[]> {
    return await InvoicePayment.query()
      .where('invoice_id', invoiceId)
      .orderBy('payment_date', 'desc')
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
