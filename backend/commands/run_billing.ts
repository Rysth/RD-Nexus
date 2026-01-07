import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class RunBilling extends BaseCommand {
  static commandName = 'billing:run'
  static description = 'Run the billing reminder job manually to generate invoices for due recurring services'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: BillingReminder } = await import('#jobs/billing_reminder')
    const { default: RecurringService } = await import('#models/recurring_service')
    const { DateTime } = await import('luxon')

    this.logger.info('Starting manual billing run...')

    const today = DateTime.now().startOf('day')

    // Show services that would be billed
    const servicesToBill = await RecurringService.query()
      .where('status', 'active')
      .where('next_billing_date', '<=', today.toSQLDate())
      .preload('project' as any, (query: any) => query.preload('client'))

    if (servicesToBill.length === 0) {
      this.logger.warning('No recurring services due for billing today')
      this.logger.info(`Today's date: ${today.toISODate()}`)
      
      // Show upcoming services
      const upcoming = await RecurringService.query()
        .where('status', 'active')
        .orderBy('next_billing_date', 'asc')
        .limit(5)
        .preload('project' as any)

      if (upcoming.length > 0) {
        this.logger.info('Upcoming services:')
        for (const service of upcoming) {
          this.logger.info(`  - ${service.name} (${service.project.name}): ${service.nextBillingDate.toISODate()}`)
        }
      }
      return
    }

    this.logger.info(`Found ${servicesToBill.length} services to bill:`)
    for (const service of servicesToBill) {
      this.logger.info(`  - ${service.name} (${service.project.name}) - Client: ${service.project.client.name}`)
    }

    const confirm = await this.prompt.confirm('Do you want to generate invoices for these services?')

    if (!confirm) {
      this.logger.info('Billing cancelled')
      return
    }

    // Run the billing job directly (not via queue for immediate feedback)
    const job = new BillingReminder()
    await job.handle()

    this.logger.success('Billing job completed! Check Mailpit for notification emails.')
  }
}
