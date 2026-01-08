import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Role from './role.js'
import OtpCode from './otp_code.js'
import VerificationToken from './verification_token.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare fullName: string | null

  @column()
  declare username: string | null

  @column()
  declare phoneNumber: string | null

  @column()
  declare identification: string | null

  @column()
  declare status: number // 1: unverified, 2: verified, 3: closed

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => Role, {
    pivotTable: 'users_roles',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare roles: ManyToMany<typeof Role>

  @hasMany(() => OtpCode)
  declare otpCodes: HasMany<typeof OtpCode>

  @hasMany(() => VerificationToken)
  declare verificationTokens: HasMany<typeof VerificationToken>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  // Helper methods
  get isVerified(): boolean {
    return this.status === 2
  }

  get isClosed(): boolean {
    return this.status === 3
  }

  get accountStatus(): string {
    switch (this.status) {
      case 1:
        return 'unverified'
      case 2:
        return 'verified'
      case 3:
        return 'closed'
      default:
        return 'unknown'
    }
  }

  // Get role names - loads roles if not already loaded
  async getRoleNames(): Promise<string[]> {
    if (!this.$preloaded.roles) {
      // Type-safe way to load relations
      const user = await User.query().where('id', this.id).preload('roles').first()
      if (user) {
        this.roles = user.roles
      }
    }
    return this.roles?.map((role) => role.name) || []
  }

  // Check if user has a specific role
  async hasRole(roleName: string): Promise<boolean> {
    const roleNames = await this.getRoleNames()
    return roleNames.includes(roleName)
  }

  // Check if user has any of the given roles
  async hasAnyRole(roleNames: string[]): Promise<boolean> {
    const userRoles = await this.getRoleNames()
    return roleNames.some((role) => userRoles.includes(role))
  }

  // Serialize user for API response
  serializeForApi() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      fullname: this.fullName,
      identification: this.identification,
      phone_number: this.phoneNumber,
      roles: this.roles?.map((r) => r.name) || [],
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
      verified: this.isVerified,
      account_status: this.accountStatus,
    }
  }
}
