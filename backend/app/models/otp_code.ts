import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import crypto from 'node:crypto'

export default class OtpCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare code: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Check if OTP is expired
  get isExpired(): boolean {
    return DateTime.now() > this.expiresAt
  }

  // Check if OTP is valid (not expired and not used)
  get isValid(): boolean {
    return !this.isExpired && !this.usedAt
  }

  // Mark OTP as used
  async markAsUsed(): Promise<void> {
    this.usedAt = DateTime.now()
    await this.save()
  }

  // Generate a new OTP code for a user
  static async generateForUser(userId: number, expiresInMinutes: number = 10): Promise<OtpCode> {
    // Invalidate any existing unused OTPs for this user
    await this.query().where('user_id', userId).whereNull('used_at').delete()

    // Generate a 6-digit code
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')

    // Create the OTP
    return await this.create({
      userId,
      code,
      expiresAt: DateTime.now().plus({ minutes: expiresInMinutes }),
    })
  }

  // Verify an OTP code for a user
  static async verifyForUser(userId: number, code: string): Promise<OtpCode | null> {
    const otp = await this.query()
      .where('user_id', userId)
      .where('code', code)
      .whereNull('used_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    return otp
  }
}
