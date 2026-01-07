import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import Project from '#models/project'
import RecurringService from '#models/recurring_service'
import Quote from '#models/quote'
import Invoice from '#models/invoice'
import CacheService from '#services/cache_service'
import { DateTime } from 'luxon'

export default class DashboardController {
  /**
   * GET /api/v1/dashboard/stats
   * Consolidated dashboard statistics for RysthDesign
   */
  async stats({ response }: HttpContext) {
    const cacheKey = 'dashboard:stats'

    const stats = await CacheService.fetch(
      cacheKey,
      async () => {
        // Parallel queries for performance
        const [
          clientsCount,
          projectsCount,
          activeProjects,
          recurringServicesActive,
          recurringServicesAll,
          pendingInvoices,
          paidInvoices,
          overdueInvoices,
          pendingQuotes,
          approvedQuotes,
          recentInvoices,
          upcomingServices,
        ] = await Promise.all([
          // Clients
          Client.query().count('* as total').first(),
          // Projects
          Project.query().count('* as total').first(),
          Project.query().where('status', 'active').count('* as total').first(),
          // Recurring Services
          RecurringService.query().where('status', 'active'),
          RecurringService.query(),
          // Invoices
          Invoice.query().where('status', 'pending'),
          Invoice.query().where('status', 'paid'),
          Invoice.query()
            .where('status', 'pending')
            .where('due_date', '<', DateTime.now().toSQLDate()),
          // Quotes
          Quote.query().whereIn('status', ['draft', 'sent']),
          Quote.query().where('status', 'approved'),
          // Recent invoices (last 5)
          Invoice.query()
            .preload('client')
            .preload('project')
            .orderBy('created_at', 'desc')
            .limit(5),
          // Upcoming billing (next 7 days)
          RecurringService.query()
            .where('status', 'active')
            .where('next_billing_date', '<=', DateTime.now().plus({ days: 7 }).toSQLDate())
            .preload('project', (q) => q.preload('client'))
            .orderBy('next_billing_date', 'asc')
            .limit(5),
        ])

        // Calculate MRR (Monthly Recurring Revenue)
        const monthlyServices = recurringServicesActive.filter((s) => s.billingCycle === 'monthly')
        const yearlyServices = recurringServicesActive.filter((s) => s.billingCycle === 'yearly')
        const mrr =
          monthlyServices.reduce((sum, s) => sum + Number(s.amount), 0) +
          yearlyServices.reduce((sum, s) => sum + Number(s.amount) / 12, 0)

        // Calculate ARR (Annual Recurring Revenue)
        const arr = mrr * 12

        // Total revenue (paid invoices)
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

        // Pending revenue
        const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

        // Overdue revenue
        const overdueRevenue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)

        // Monthly revenue breakdown (last 6 months)
        const sixMonthsAgo = DateTime.now().minus({ months: 6 }).startOf('month')
        const monthlyRevenue: { month: string; revenue: number; invoices: number }[] = []

        for (let i = 0; i < 6; i++) {
          const monthStart = sixMonthsAgo.plus({ months: i })
          const monthEnd = monthStart.endOf('month')

          const monthInvoices = paidInvoices.filter((inv) => {
            const paymentDate = inv.paymentDate
            if (!paymentDate) return false
            return paymentDate >= monthStart && paymentDate <= monthEnd
          })

          monthlyRevenue.push({
            month: monthStart.toFormat('MMM yy', { locale: 'es' }),
            revenue: monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
            invoices: monthInvoices.length,
          })
        }

        return {
          // Summary cards
          summary: {
            clients_count: Number((clientsCount as any)?.$extras?.total || 0),
            projects_count: Number((projectsCount as any)?.$extras?.total || 0),
            active_projects_count: Number((activeProjects as any)?.$extras?.total || 0),
            active_services_count: recurringServicesActive.length,
            total_services_count: recurringServicesAll.length,
          },
          // Revenue metrics
          revenue: {
            mrr: Math.round(mrr * 100) / 100,
            arr: Math.round(arr * 100) / 100,
            total_collected: Math.round(totalRevenue * 100) / 100,
            pending: Math.round(pendingRevenue * 100) / 100,
            overdue: Math.round(overdueRevenue * 100) / 100,
          },
          // Invoice stats
          invoices: {
            pending_count: pendingInvoices.length,
            paid_count: paidInvoices.length,
            overdue_count: overdueInvoices.length,
          },
          // Quote stats
          quotes: {
            pending_count: pendingQuotes.length,
            approved_count: approvedQuotes.length,
          },
          // Monthly chart data
          monthly_revenue: monthlyRevenue,
          // Recent activity
          recent_invoices: recentInvoices.map((inv) => ({
            id: inv.id,
            invoice_number: inv.invoiceNumber,
            client_name: inv.client?.name || 'N/A',
            project_name: inv.project?.name || null,
            total: Number(inv.total),
            status: inv.status,
            status_label: inv.statusLabel,
            issue_date: inv.issueDate.toISODate(),
          })),
          // Upcoming billing
          upcoming_billing: upcomingServices.map((s) => ({
            id: s.id,
            service_name: s.name,
            project_name: s.project?.name || 'N/A',
            client_name: s.project?.client?.name || 'N/A',
            amount: Number(s.amount),
            billing_cycle: s.billingCycle,
            next_billing_date: s.nextBillingDate.toISODate(),
          })),
        }
      },
      120 // Cache for 2 minutes
    )

    return response.ok(stats)
  }
}
