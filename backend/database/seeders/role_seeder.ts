import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'

export default class RoleSeeder extends BaseSeeder {
  async run() {
    // Create default roles
    const roles = ['admin', 'manager', 'user']

    for (const roleName of roles) {
      await Role.firstOrCreate({ name: roleName })
    }

    console.log('Default roles created: admin, manager, user')
  }
}
