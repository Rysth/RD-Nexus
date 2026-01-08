import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Role from '#models/role'
import Business from '#models/business'

/**
 * Production Seeder - Only creates essential data for production deployment
 * Run with: node ace db:seed --files database/seeders/production_seeder.ts
 */
export default class ProductionSeeder extends BaseSeeder {
  static environment = ['production']

  async run() {
    console.log('🚀 Running Production Seeder...')

    // 1. Create default roles
    console.log('  → Creating roles...')
    const adminRole = await Role.firstOrCreate({ name: 'admin' })
    await Role.firstOrCreate({ name: 'manager' })
    await Role.firstOrCreate({ name: 'user' })
    console.log('  ✓ Roles created: admin, manager, user')

    // 2. Create or update admin user
    const adminEmail = 'johnpalacios.t@gmail.com'
    const adminPassword = (process.env.ADMIN_PASSWORD || 'NexusAdmin2026!').trim() // Change this after first login!
    const forcePasswordReset = ['1', 'true', 'yes', 'on'].includes(
      (process.env.FORCE_ADMIN_PASSWORD_RESET || '').toLowerCase()
    )
    let didSetAdminPassword = false
    console.log(`  → Setting up admin user: ${adminEmail}...`)

    let admin = await User.findBy('email', adminEmail)
    if (!admin) {
      admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        fullName: 'John Palacios',
        username: 'johnpalacios',
        status: 2, // verified
      })
      didSetAdminPassword = true
      console.log('  ✓ Admin user created')
    } else {
      const passwordLooksHashed = typeof admin.password === 'string' && admin.password.startsWith('$scrypt$')

      if (forcePasswordReset) {
        admin.merge({ password: adminPassword })
        await admin.save()
        didSetAdminPassword = true
        console.log('  ✓ Admin password force-reset')
      } else if (!passwordLooksHashed) {
        admin.merge({ password: adminPassword })
        await admin.save()
        didSetAdminPassword = true
        console.log('  ✓ Admin password repaired (was not hashed)')
      } else {
        console.log('  ✓ Admin user already exists')
      }
    }

    // Ensure admin has admin role
    const existingRoles = await admin.related('roles').query()
    const hasAdminRole = existingRoles.some((r) => r.name === 'admin')
    if (!hasAdminRole) {
      await admin.related('roles').attach([adminRole.id])
      console.log('  ✓ Admin role assigned')
    }

    // 3. Create business (RysthDesign)
    console.log('  → Setting up business...')
    let business = await Business.first()
    if (!business) {
      business = await Business.create({
        name: 'Nexus',
        slogan: 'by RysthDesign',
        whatsapp: '0988949117',
        instagram: 'rysthdesign',
        facebook: 'rysthdesign',
        tiktok: 'rysthdesign',
      })
      console.log('  ✓ Business created: Nexus by RysthDesign')
    } else {
      console.log('  ✓ Business already exists')
    }

    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('  🎉 Production setup complete!')
    console.log('═══════════════════════════════════════════════════')
    console.log(`  Admin Email: ${adminEmail}`)
    if (didSetAdminPassword) {
      console.log(`  Admin Password: ${adminPassword}`)
      console.log('  ⚠️  IMPORTANT: Change your password after first login!')
    } else {
      console.log('  Admin Password: (unchanged)')
      console.log('  ℹ️  To reset: set FORCE_ADMIN_PASSWORD_RESET=true and ADMIN_PASSWORD')
    }
    console.log('═══════════════════════════════════════════════════')
  }
}
