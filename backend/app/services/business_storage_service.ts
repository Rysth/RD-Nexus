import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import env from '#start/env'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import type Business from '#models/business'

/**
 * Service for managing business logo uploads
 * Similar to CloudflareBusinessStorageService in Rails
 */
export default class BusinessStorageService {
  /**
   * Upload and attach a logo to a business
   * 
   * @param business - The business model instance
   * @param file - The uploaded file from multipart request
   * @returns The public URL of the uploaded logo
   */
  static async attachLogo(business: Business, file: MultipartFile): Promise<string> {
    // Generate unique filename with folder structure
    const folderPath = `business/${business.id}`
    const fileName = `logo_${cuid()}.${file.extname}`
    const key = `${folderPath}/${fileName}`

    // Move file to the configured disk (fs in dev, r2 in production)
    await file.moveToDisk(key)

    // Get the public URL for the file
    const disk = drive.use()
    let url = await disk.getUrl(key)

    // Normalize to absolute URL when the fs disk returns a relative path
    if (url && url.startsWith('./')) {
      url = url.slice(1)
    }
    if (url && url.startsWith('/')) {
      const appUrl = env.get('APP_URL', '')
      url = appUrl ? `${appUrl}${url}` : url
    }

    // Update business with the new logo URL
    business.logoUrl = url
    await business.save()

    // Delete old logo if it exists and is different
    // (we handle this in the controller before uploading)

    return url
  }

  /**
   * Delete the logo for a business
   * 
   * @param business - The business model instance
   */
  static async deleteLogo(business: Business): Promise<void> {
    if (!business.logoUrl) {
      return
    }

    try {
      // Extract the key from the URL
      const key = this.extractKeyFromUrl(business.logoUrl)
      
      if (key) {
        const disk = drive.use()
        await disk.delete(key)
      }

      // Clear the logo URL
      business.logoUrl = null
      await business.save()
    } catch (error) {
      console.error('Error deleting business logo:', error)
      // Don't throw - just log the error and clear the URL
      business.logoUrl = null
      await business.save()
    }
  }

  /**
   * Delete a specific file by key
   * Useful when replacing a logo (delete old before uploading new)
   * 
   * @param key - The storage key of the file to delete
   */
  static async deleteByKey(key: string): Promise<void> {
    try {
      const disk = drive.use()
      await disk.delete(key)
    } catch (error) {
      console.error('Error deleting file by key:', error)
    }
  }

  /**
   * Extract the storage key from a URL
   * Works for both local fs URLs (/uploads/...) and R2 CDN URLs
   * 
   * @param url - The file URL
   * @returns The storage key or null if not extractable
   */
  private static extractKeyFromUrl(url: string): string | null {
    try {
      // For local fs URLs like /uploads/business/1/logo_xxx.png
      if (url.startsWith('/uploads/')) {
        return url.replace('/uploads/', '')
      }

      // For full URLs, extract the path
      const parsedUrl = new URL(url)
      const path = parsedUrl.pathname
      
      // Remove leading slash if present
      return path.startsWith('/') ? path.slice(1) : path
    } catch {
      return null
    }
  }

  /**
   * Check if a file exists
   * 
   * @param key - The storage key to check
   * @returns Whether the file exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const disk = drive.use()
      return await disk.exists(key)
    } catch {
      return false
    }
  }
}
