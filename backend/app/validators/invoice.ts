import vine from '@vinejs/vine'

/**
 * Validator for creating an invoice manually
 */
export const createInvoiceValidator = vine.compile(
  vine.object({
    client_id: vine.number().positive(),
    project_id: vine.number().positive().optional(),
    issue_date: vine.string(),
    due_date: vine.string(),
    tax_rate: vine.number().min(0).max(100).optional(),
    notes: vine.string().optional(),
    terms_conditions: vine.string().optional().nullable(),
    items: vine.array(
      vine.object({
        description: vine.string().minLength(1),
        quantity: vine.number().min(0.01),
        unit_price: vine.number().min(0),
        discount_percent: vine.number().min(0).max(100).optional(),
        payment_type: vine.enum(['unico', 'anual', 'mensual']).optional(),
        notes: vine.string().optional(),
      })
    ).minLength(1),
  })
)

/**
 * Validator for updating an invoice
 */
export const updateInvoiceValidator = vine.compile(
  vine.object({
    issue_date: vine.string().optional(),
    due_date: vine.string().optional(),
    tax_rate: vine.number().min(0).max(100).optional(),
    notes: vine.string().optional(),
    terms_conditions: vine.string().optional().nullable(),
    items: vine.array(
      vine.object({
        id: vine.number().positive().optional(),
        description: vine.string().minLength(1),
        quantity: vine.number().min(0.01),
        unit_price: vine.number().min(0),
        discount_percent: vine.number().min(0).max(100).optional(),
        payment_type: vine.enum(['unico', 'anual', 'mensual']).optional(),
        notes: vine.string().optional(),
      })
    ).minLength(1).optional(),
  })
)

/**
 * Validator for converting a quote to invoice
 */
export const convertFromQuoteValidator = vine.compile(
  vine.object({
    quote_id: vine.number().positive(),
    due_days: vine.number().min(1).max(365).optional(),
  })
)

/**
 * Validator for marking invoice as paid (legacy - full payment)
 */
export const markAsPaidValidator = vine.compile(
  vine.object({
    payment_method: vine.enum(['transfer', 'cash', 'card', 'other']),
    payment_notes: vine.string().optional(),
  })
)

/**
 * Validator for registering a payment (partial or full)
 */
export const registerPaymentValidator = vine.compile(
  vine.object({
    amount: vine.number().positive(),
    payment_date: vine.string().optional(), // ISO date, defaults to today
    payment_method: vine.enum(['transfer', 'cash', 'card', 'other']),
    notes: vine.string().optional(),
  })
)
