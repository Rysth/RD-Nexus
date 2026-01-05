import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Client from '#models/client'
import Project from '#models/project'
import Quote from '#models/quote'

type ClientSeed = {
  key: string
  name: string
  identificationType: string
  identification: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

type ProjectSeed = {
  key: string
  clientKey: string
  name: string
  productionUrl?: string | null
  startDate?: string | null
  status: 'active' | 'maintenance' | 'canceled'
  description?: string | null
}

type QuoteSeed = {
  clientKey: string
  projectKey?: string | null
  quoteNumber: string
  title: string
  issueDate: string
  validUntil: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  subtotal: number
  taxRate: number
  notes?: string | null
}

export default class ClientProjectQuoteSeeder extends BaseSeeder {
  public async run() {
    const clientsData: ClientSeed[] = [
      {
        key: 'acme',
        name: 'Acme Corp',
        identificationType: '04',
        identification: '1790010011001',
        email: 'contact@acme.test',
        phone: '+593999111001',
        address: 'Av. Siempre Viva 123, Quito',
        notes: 'Cliente corporativo con soporte prioritario.',
      },
      {
        key: 'globex',
        name: 'Globex LLC',
        identificationType: '05',
        identification: '1715151515',
        email: 'ventas@globex.test',
        phone: '+593999222002',
        address: 'Calle 10 y Amazonas, Quito',
        notes: 'Enfoque en proyectos web con SLA mensual.',
      },
      {
        key: 'initech',
        name: 'Initech',
        identificationType: '06',
        identification: 'P-99887766',
        email: 'info@initech.test',
        phone: '+593999333003',
        address: 'Parque Industrial, Guayaquil',
        notes: 'Proyectos con facturacion recurrente.',
      },
    ]

    const clientMap = new Map<string, Client>()

    for (const data of clientsData) {
      const client = await Client.updateOrCreate(
        { identification: data.identification },
        {
          name: data.name,
          identificationType: data.identificationType,
          identification: data.identification,
          email: data.email ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
        }
      )

      clientMap.set(data.key, client)
    }

    const projectsData: ProjectSeed[] = [
      {
        key: 'acme-site',
        clientKey: 'acme',
        name: 'Sitio corporativo Acme',
        productionUrl: 'https://acme.example.com',
        startDate: '2025-01-15',
        status: 'active',
        description: 'Redisenho y CMS headless para marketing.',
      },
      {
        key: 'acme-app',
        clientKey: 'acme',
        name: 'Portal de clientes Acme',
        productionUrl: 'https://clientes.acme.example.com',
        startDate: '2025-03-01',
        status: 'maintenance',
        description: 'Portal con autenticacion y facturacion.',
      },
      {
        key: 'globex-erp',
        clientKey: 'globex',
        name: 'Integracion ERP Globex',
        productionUrl: null,
        startDate: '2025-02-10',
        status: 'active',
        description: 'Integraciones con API ERP y reportes BI.',
      },
      {
        key: 'initech-subs',
        clientKey: 'initech',
        name: 'Plataforma de suscripciones',
        productionUrl: null,
        startDate: '2025-04-05',
        status: 'active',
        description: 'Backend para planes y pagos recurrentes.',
      },
    ]

    const projectMap = new Map<string, Project>()

    for (const data of projectsData) {
      const client = clientMap.get(data.clientKey)

      if (!client) {
        console.warn(`Client ${data.clientKey} not found; skipping project ${data.name}`)
        continue
      }

      const project = await Project.updateOrCreate(
        { name: data.name, clientId: client.id },
        {
          clientId: client.id,
          name: data.name,
          productionUrl: data.productionUrl ?? null,
          startDate: data.startDate ? DateTime.fromISO(data.startDate) : null,
          status: data.status,
          description: data.description ?? null,
        }
      )

      projectMap.set(data.key, project)
    }

    const quotesData: QuoteSeed[] = [
      {
        clientKey: 'acme',
        projectKey: 'acme-site',
        quoteNumber: 'Q-2026-0001',
        title: 'Renovacion sitio corporativo',
        issueDate: '2026-01-02',
        validUntil: '2026-01-16',
        status: 'sent',
        subtotal: 5500,
        taxRate: 15,
        notes: 'Incluye diseno responsivo y optimizacion SEO.',
      },
      {
        clientKey: 'acme',
        projectKey: 'acme-app',
        quoteNumber: 'Q-2026-0002',
        title: 'Portal de clientes - nuevas funcionalidades',
        issueDate: '2026-01-03',
        validUntil: '2026-02-02',
        status: 'draft',
        subtotal: 7200,
        taxRate: 15,
        notes: 'Incluye autenticacion SSO y facturacion electronica.',
      },
      {
        clientKey: 'globex',
        projectKey: 'globex-erp',
        quoteNumber: 'Q-2026-0003',
        title: 'Integraciones ERP y BI',
        issueDate: '2025-12-20',
        validUntil: '2026-01-03',
        status: 'approved',
        subtotal: 9800,
        taxRate: 15,
        notes: 'Entrega por fases con panel de reportes.',
      },
      {
        clientKey: 'initech',
        projectKey: 'initech-subs',
        quoteNumber: 'Q-2026-0004',
        title: 'Plataforma de suscripciones',
        issueDate: '2026-01-04',
        validUntil: '2026-01-18',
        status: 'sent',
        subtotal: 8400,
        taxRate: 15,
        notes: 'Incluye pasarela de pagos y notificaciones.',
      },
      {
        clientKey: 'globex',
        projectKey: null,
        quoteNumber: 'Q-2026-0005',
        title: 'Soporte y horas bolsa',
        issueDate: '2026-01-05',
        validUntil: '2026-01-19',
        status: 'draft',
        subtotal: 3000,
        taxRate: 0,
        notes: 'Horas de soporte trimestrales sin impuestos.',
      },
    ]

    for (const data of quotesData) {
      const client = clientMap.get(data.clientKey)
      if (!client) {
        console.warn(`Client ${data.clientKey} not found; skipping quote ${data.quoteNumber}`)
        continue
      }

      const project = data.projectKey ? projectMap.get(data.projectKey) : null

      const subtotal = data.subtotal
      const taxRate = data.taxRate
      const taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2))
      const total = Number((subtotal + taxAmount).toFixed(2))

      await Quote.updateOrCreate(
        { quoteNumber: data.quoteNumber },
        {
          clientId: client.id,
          projectId: project?.id ?? null,
          quoteNumber: data.quoteNumber,
          title: data.title,
          issueDate: DateTime.fromISO(data.issueDate),
          validUntil: DateTime.fromISO(data.validUntil),
          status: data.status,
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: data.notes ?? null,
        }
      )
    }

    console.log('Seeded clients, projects, and quotes')
  }
}