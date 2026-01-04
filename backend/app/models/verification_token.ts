import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import string from '@adonisjs/core/helpers/string'

export default class VerificationToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare token: string

  @column()
  declare type: 'email_verification' | 'password_reset'

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare usedAt: DateTime | null

  @column.dateTime()
  declare emailLastSent: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Check if token is expired
  get isExpired(): boolean {
    return DateTime.now() > this.expiresAt
  }

  // Check if token is valid
  get isValid(): boolean {
    return !this.isExpired && !this.usedAt
  }

  // Mark token as used
  async markAsUsed(): Promise<void> {
    this.usedAt = DateTime.now()
    await this.save()
  }

  // Generate a new token for a user
  static async generateForUser(
    userId: number,
    type: 'email_verification' | 'password_reset',
    expiresInHours: number = 24
  ): Promise<VerificationToken> {
    // Invalidate any existing unused tokens of this type for this user
    await this.query().where('user_id', userId).where('type', type).whereNull('used_at').delete()

    // Generate a secure token
    const token = string.random(64)

    // Create the token
    return await this.create({
      userId,
      token,
      type,
      expiresAt: DateTime.now().plus({ hours: expiresInHours }),
      emailLastSent: DateTime.now(),
    })
  }

  // Find and validate a token
  static async findValidToken(
    token: string,
    type: 'email_verification' | 'password_reset'
  ): Promise<VerificationToken | null> {
    return await this.query()
      .where('token', token)
      .where('type', type)
      .whereNull('used_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()
  }

  // Check if email was sent recently (for rate limiting)
  canResendEmail(minutes: number = 2): boolean {
    if (!this.emailLastSent) return true
    return DateTime.now().diff(this.emailLastSent, 'minutes').minutes >= minutes
  }

  // Update email sent timestamp
  async updateEmailSent(): Promise<void> {
    this.emailLastSent = DateTime.now()
    await this.save()
  }
}
