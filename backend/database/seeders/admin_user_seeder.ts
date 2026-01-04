import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Role from '#models/role'

export default class AdminUserSeeder extends BaseSeeder {
  async run() {
    // Find or create admin role first
    const adminRole = await Role.firstOrCreate({ name: 'admin' })

    // Check if admin user exists
    const existingAdmin = await User.findBy('email', 'admin@example.com')
    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      fullName: 'Administrator',
      username: 'admin',
      status: 2, // verified
    })

    // Assign admin role
    await admin.related('roles').attach([adminRole.id])

    console.log('Admin user created:')
    console.log('  Email: admin@example.com')
    console.log('  Password: password123')
  }
}
