import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Role from '#models/role'

export default class SampleUsersSeeder extends BaseSeeder {
  // Generates a set of demo users to exercise pagination
  async run() {
    const userRole = await Role.findOrCreateByName('user')

    const totalToCreate = 200
    const password = 'Password123!'

    for (let i = 1; i <= totalToCreate; i++) {
      const email = `seeduser${i}@example.com`

      const exists = await User.findBy('email', email)
      if (exists) {
        continue
      }

      const user = await User.create({
        email,
        password,
        fullName: `Usuario ${i}`,
        username: `user${i}`,
        phoneNumber: `300000${i.toString().padStart(3, '0')}`,
        identification: `ID-${i.toString().padStart(4, '0')}`,
        status: 2, // verified
      })

      await user.related('roles').attach([userRole.id])
    }

    console.log(`Seeded up to ${totalToCreate} demo users`)
  }
}
