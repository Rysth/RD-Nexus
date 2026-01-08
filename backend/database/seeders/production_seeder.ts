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
    console.log(`  → Setting up admin user: ${adminEmail}...`)

    let admin = await User.findBy('email', adminEmail)
    if (!admin) {
      admin = await User.create({
        email: adminEmail,
        password: 'NexusAdmin2026!', // Change this after first login!
        fullName: 'John Palacios',
        username: 'johnpalacios',
        status: 2, // verified
      })
      console.log('  ✓ Admin user created')
    } else {
      if (!admin.password.startsWith('$scrypt$')) {
        admin.merge({ password: 'NexusAdmin2026!' })
        await admin.save()
        console.log('  ✓ Admin password reset and hashed')
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
    console.log('  Admin Password: NexusAdmin2026!')
    console.log('  ⚠️  IMPORTANT: Change your password after first login!')
    console.log('═══════════════════════════════════════════════════')
  }
}
