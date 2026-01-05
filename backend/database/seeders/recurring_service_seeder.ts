import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Project from '#models/project'
import RecurringService from '#models/recurring_service'

type RecurringServiceSeed = {
  projectName: string
  name: string
  amount: number
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  status: 'active' | 'paused'
  description?: string | null
}

export default class RecurringServiceSeeder extends BaseSeeder {
  public async run() {
    // First, get existing projects by name to link recurring services
    const projects = await Project.query().select('id', 'name')
    const projectMap = new Map<string, number>()

    for (const project of projects) {
      projectMap.set(project.name, project.id)
    }

    const recurringServicesData: RecurringServiceSeed[] = [
      // Acme Corp - Sitio corporativo
      {
        projectName: 'Sitio corporativo Acme',
        name: 'Hosting Premium',
        amount: 49.99,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-01',
        status: 'active',
        description: 'Servidor VPS dedicado con 4GB RAM, 80GB SSD, backups diarios.',
      },
      {
        projectName: 'Sitio corporativo Acme',
        name: 'Mantenimiento Web',
        amount: 150.0,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-01',
        status: 'active',
        description: 'Actualizaciones de seguridad, monitoreo y soporte técnico.',
      },
      {
        projectName: 'Sitio corporativo Acme',
        name: 'Certificado SSL Wildcard',
        amount: 199.99,
        billingCycle: 'yearly',
        nextBillingDate: '2027-01-15',
        status: 'active',
        description: 'Certificado SSL wildcard para todos los subdominios.',
      },

      // Acme Corp - Portal de clientes
      {
        projectName: 'Portal de clientes Acme',
        name: 'Hosting Cloud',
        amount: 89.99,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-01',
        status: 'active',
        description: 'Instancia cloud escalable con balanceador de carga.',
      },
      {
        projectName: 'Portal de clientes Acme',
        name: 'Soporte Premium 24/7',
        amount: 299.0,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-01',
        status: 'paused',
        description: 'Soporte técnico prioritario con SLA de 2 horas. Pausado temporalmente.',
      },

      // Globex - Integración ERP
      {
        projectName: 'Integracion ERP Globex',
        name: 'Licencia API ERP',
        amount: 450.0,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-10',
        status: 'active',
        description: 'Licencia de uso de API para integraciones con sistema ERP.',
      },
      {
        projectName: 'Integracion ERP Globex',
        name: 'Almacenamiento de datos BI',
        amount: 120.0,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-10',
        status: 'active',
        description: 'Base de datos dedicada para reportes y analytics.',
      },
      {
        projectName: 'Integracion ERP Globex',
        name: 'Soporte y Mantenimiento ERP',
        amount: 1800.0,
        billingCycle: 'yearly',
        nextBillingDate: '2027-02-10',
        status: 'active',
        description: 'Contrato anual de mantenimiento y actualizaciones.',
      },

      // Initech - Plataforma de suscripciones
      {
        projectName: 'Plataforma de suscripciones',
        name: 'Pasarela de pagos',
        amount: 79.99,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-05',
        status: 'active',
        description: 'Integración con procesador de pagos, incluye 1000 transacciones.',
      },
      {
        projectName: 'Plataforma de suscripciones',
        name: 'Servicio de notificaciones',
        amount: 35.0,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-05',
        status: 'active',
        description: 'Envío de emails transaccionales y notificaciones push.',
      },
      {
        projectName: 'Plataforma de suscripciones',
        name: 'Hosting Dedicado',
        amount: 199.99,
        billingCycle: 'monthly',
        nextBillingDate: '2026-02-05',
        status: 'active',
        description: 'Servidor dedicado con alta disponibilidad y redundancia.',
      },
      {
        projectName: 'Plataforma de suscripciones',
        name: 'Auditoría de seguridad',
        amount: 2500.0,
        billingCycle: 'yearly',
        nextBillingDate: '2027-04-05',
        status: 'active',
        description: 'Auditoría anual de seguridad y pruebas de penetración.',
      },
    ]

    let created = 0
    let skipped = 0

    for (const data of recurringServicesData) {
      const projectId = projectMap.get(data.projectName)

      if (!projectId) {
        console.warn(`Project "${data.projectName}" not found; skipping service "${data.name}"`)
        skipped++
        continue
      }

      await RecurringService.updateOrCreate(
        { projectId, name: data.name },
        {
          projectId,
          name: data.name,
          amount: data.amount,
          billingCycle: data.billingCycle,
          nextBillingDate: DateTime.fromISO(data.nextBillingDate),
          status: data.status,
          description: data.description ?? null,
        }
      )
      created++
    }

    console.log(`Seeded ${created} recurring services (${skipped} skipped)`)
  }
}
