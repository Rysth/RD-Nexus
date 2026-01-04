import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate } from '@adonisjs/lucid/orm'

export default class Business extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slogan: string | null

  @column()
  declare logoUrl: string | null

  @column()
  declare whatsapp: string | null

  @column()
  declare instagram: string | null

  @column()
  declare facebook: string | null

  @column()
  declare tiktok: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Get current business or create default
  static async current(): Promise<Business> {
    let business = await this.first()
    
    if (!business) {
      business = await this.create({
        name: 'Nexus',
        slogan: 'by RysthDesign',
        whatsapp: '',
        instagram: '',
        facebook: '',
        tiktok: '',
      })
    }
    
    return business
  }

  // Serialize for API response
  serializeForApi() {
    return {
      id: this.id,
      name: this.name,
      slogan: this.slogan,
      logo_url: this.logoUrl,
      whatsapp: this.whatsapp,
      instagram: this.instagram,
      facebook: this.facebook,
      tiktok: this.tiktok,
      created_at: this.createdAt?.toISO(),
      updated_at: this.updatedAt?.toISO(),
    }
  }

  // Get name or default
  get nameOrDefault(): string {
    return this.name || 'Nexus'
  }

  // Get slogan or default
  get sloganOrDefault(): string {
    return this.slogan || 'by RysthDesign'
  }
}