import type { HttpContext } from '@adonisjs/core/http'
import Business from '#models/business'
import BusinessStorageService from '#services/business_storage_service'
import vine from '@vinejs/vine'

// Validator for updating business
const updateBusinessValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(100),
    slogan: vine.string().trim().maxLength(200).optional(),
    whatsapp: vine.string().trim().maxLength(20).optional(),
    instagram: vine.string().trim().maxLength(50).optional(),
    facebook: vine.string().trim().maxLength(50).optional(),
    tiktok: vine.string().trim().maxLength(50).optional(),
  })
)

// Helper function to get or create business
async function getOrCreateBusiness(): Promise<Business> {
  let business = await Business.first()
  
  if (!business) {
    business = await Business.create({
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

// Helper to serialize business for API
function serializeBusiness(business: Business) {
  return {
    id: business.id,
    name: business.name,
    slogan: business.slogan,
    logo_url: business.logoUrl,
    whatsapp: business.whatsapp,
    instagram: business.instagram,
    facebook: business.facebook,
    tiktok: business.tiktok,
    created_at: business.createdAt?.toISO(),
    updated_at: business.updatedAt?.toISO(),
  }
}

export default class BusinessesController {
  /**
   * Get public business info (no auth required)
   * GET /api/v1/public/business
   */
  async publicShow({ response }: HttpContext) {
    const business = await getOrCreateBusiness()
    
    return response.ok({
      business: serializeBusiness(business),
    })
  }

  /**
   * Get current business (requires auth)
   * GET /api/v1/businesses/current
   */
  async current({ response }: HttpContext) {
    const business = await getOrCreateBusiness()
    
    return response.ok(serializeBusiness(business))
  }

  /**
   * Update business
   * PUT /api/v1/businesses/:id
   * Supports multipart/form-data with optional logo file
   */
  async update({ params, request, response }: HttpContext) {
    const business = await Business.find(params.id)
    
    if (!business) {
      return response.notFound({
        error: 'Negocio no encontrado',
      })
    }

    const data = await request.validateUsing(updateBusinessValidator)
    
    business.merge({
      name: data.name,
      slogan: data.slogan || null,
      whatsapp: data.whatsapp || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      tiktok: data.tiktok || null,
    })

    await business.save()

    // Handle logo upload if included in the request
    const logo = request.file('logo', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (logo) {
      if (!logo.isValid) {
        return response.badRequest({
          errors: logo.errors,
        })
      }

      try {
        // Delete old logo if exists
        if (business.logoUrl) {
          await BusinessStorageService.deleteLogo(business)
        }

        // Upload new logo using Drive
        await BusinessStorageService.attachLogo(business, logo)
        await business.refresh()
      } catch (error) {
        console.error('Error uploading logo:', error)
        // Don't fail the whole update, just log the error
      }
    }
    
    return response.ok(serializeBusiness(business))
  }

  /**
   * Handle logo upload
   * POST /api/v1/businesses/:id/logo
   */
  async uploadLogo({ params, request, response }: HttpContext) {
    const business = await Business.find(params.id)
    
    if (!business) {
      return response.notFound({
        error: 'Negocio no encontrado',
      })
    }

    const logo = request.file('logo', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!logo) {
      return response.badRequest({
        error: 'No se proporcionó un archivo de logo',
      })
    }

    if (!logo.isValid) {
      return response.badRequest({
        errors: logo.errors,
      })
    }

    try {
      // Delete old logo if exists
      if (business.logoUrl) {
        await BusinessStorageService.deleteLogo(business)
      }

      // Upload new logo using Drive
      await BusinessStorageService.attachLogo(business, logo)

      // Reload business to get updated logo URL
      await business.refresh()

      return response.ok(serializeBusiness(business))
    } catch (error) {
      console.error('Error uploading logo:', error)
      return response.internalServerError({
        error: 'Error al subir el logo. Intenta nuevamente.',
      })
    }
  }
}
