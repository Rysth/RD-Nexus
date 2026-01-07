import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  /**
   * Default disk to use for file operations.
   * In development, use 'fs' (local filesystem).
   * In production, use 'r2' (Cloudflare R2).
   */
  default: env.get('DRIVE_DISK', 'fs'),

  services: {
    /**
     * Local filesystem driver for development
     * Files are stored in the 'storage' directory
     */
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
      appUrl: env.get('APP_URL', 'http://localhost:3333'),
    }),

    /**
     * Cloudflare R2 driver for production
     * R2 is S3-compatible, so we use the S3 driver
     */
    r2: services.s3({
      credentials: {
        accessKeyId: env.get('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('R2_SECRET_ACCESS_KEY', ''),
      },
      region: 'auto', // R2 uses 'auto' as the region
      bucket: env.get('R2_BUCKET', ''),
      endpoint: env.get('R2_ENDPOINT', ''),
      visibility: 'public',
      // R2 doesn't support per-object ACL
      supportsACL: false,
      // CDN URL for public files (optional, use R2 public URL or custom domain)
      cdnUrl: env.get('R2_CDN_URL', ''),
    }),
  },
})

export default driveConfig

/**
 * Inferring types for the list of disks
 */
declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
