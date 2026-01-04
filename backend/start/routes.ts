/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import {
  globalThrottle,
  authThrottle,
  otpThrottle,
  passwordResetThrottle,
  signupThrottle,
  verificationResendThrottle,
  sensitiveThrottle,
} from './limiter.js'

const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const BusinessesController = () => import('#controllers/businesses_controller')
const ClientsController = () => import('#controllers/clients_controller')
const ProjectsController = () => import('#controllers/projects_controller')
const RecurringServicesController = () => import('#controllers/recurring_services_controller')
const QuotesController = () => import('#controllers/quotes_controller')

// Health check
router.get('/', async () => {
  return {
    status: 'ok',
    message: 'AdonisJS API is running',
  }
})

// Jobs dashboard (protected with auth middleware in production)
// Access at /jobs to view BullMQ dashboard
router.jobs('/jobs')

// API v1 routes
router
  .group(() => {
    // Public routes (no auth required)
    router.get('/public/business', [BusinessesController, 'publicShow'])
    
    // Public auth routes with rate limiting
    router.post('/create-account', [AuthController, 'register']).use(signupThrottle)
    router.post('/login', [AuthController, 'login']).use(authThrottle)
    router.post('/verify-account', [AuthController, 'verifyEmail']).use(authThrottle)
    router.post('/verify-account-resend', [AuthController, 'resendVerification']).use(verificationResendThrottle)
    router.post('/reset-password-request', [AuthController, 'requestPasswordReset']).use(passwordResetThrottle)
    router.post('/reset-password', [AuthController, 'resetPassword']).use(authThrottle)

    // OTP routes (under /auth prefix to match frontend) with rate limiting
    router
      .group(() => {
        router.post('/verify_otp', [AuthController, 'verifyOtp']).use(otpThrottle)
        router.post('/send_otp', [AuthController, 'resendOtp']).use(otpThrottle)
      })
      .prefix('/auth')

    // Protected routes (require authentication)
    router
      .group(() => {
        // Current user
        router.get('/me', [AuthController, 'me'])
        router.post('/logout', [AuthController, 'logout'])
        router.put('/profile/update_info', [AuthController, 'updateProfile']).use(sensitiveThrottle)
        router.put('/profile/update_password', [AuthController, 'updatePassword']).use(sensitiveThrottle)

        // Business management (admin/manager only)
        router.get('/businesses/current', [BusinessesController, 'current'])
        router.put('/businesses/:id', [BusinessesController, 'update']).use(sensitiveThrottle)
        router.post('/businesses/:id/logo', [BusinessesController, 'uploadLogo']).use(sensitiveThrottle)

        // Users management (admin/manager only) with sensitive operation throttling
        router
          .group(() => {
            router.get('/', [UsersController, 'index'])
            router.get('/export', [UsersController, 'export'])
            router.post('/', [UsersController, 'store']).use(sensitiveThrottle)
            router.get('/:id', [UsersController, 'show'])
            router.put('/:id', [UsersController, 'update']).use(sensitiveThrottle)
            router.delete('/:id', [UsersController, 'destroy']).use(sensitiveThrottle)
            router.put('/:id/toggle_confirmation', [UsersController, 'toggleConfirmation']).use(sensitiveThrottle)
            router.put('/:id/update_password', [UsersController, 'updatePassword']).use(sensitiveThrottle)
          })
          .prefix('/users')

        // Clients management
        router
          .group(() => {
            router.get('/', [ClientsController, 'index'])
            router.get('/export', [ClientsController, 'export'])
            router.post('/', [ClientsController, 'store']).use(sensitiveThrottle)
            router.get('/:id', [ClientsController, 'show'])
            router.put('/:id', [ClientsController, 'update']).use(sensitiveThrottle)
            router.delete('/:id', [ClientsController, 'destroy']).use(sensitiveThrottle)
            router.get('/:clientId/projects', [ProjectsController, 'byClient'])
          })
          .prefix('/clients')

        // Projects management
        router
          .group(() => {
            router.get('/', [ProjectsController, 'index'])
            router.post('/', [ProjectsController, 'store']).use(sensitiveThrottle)
            router.get('/:id', [ProjectsController, 'show'])
            router.put('/:id', [ProjectsController, 'update']).use(sensitiveThrottle)
            router.delete('/:id', [ProjectsController, 'destroy']).use(sensitiveThrottle)
            // Nested: recurring services by project
            router.get('/:projectId/recurring-services', [RecurringServicesController, 'byProject'])
          })
          .prefix('/projects')

        // Recurring Services management
        router
          .group(() => {
            router.get('/', [RecurringServicesController, 'index'])
            router.post('/', [RecurringServicesController, 'store']).use(sensitiveThrottle)
            router.get('/:id', [RecurringServicesController, 'show'])
            router.put('/:id', [RecurringServicesController, 'update']).use(sensitiveThrottle)
            router.delete('/:id', [RecurringServicesController, 'destroy']).use(sensitiveThrottle)
            router.patch('/:id/toggle-status', [RecurringServicesController, 'toggleStatus']).use(sensitiveThrottle)
          })
          .prefix('/recurring-services')

        // Quotes management
        router
          .group(() => {
            router.get('/', [QuotesController, 'index'])
            router.post('/', [QuotesController, 'store']).use(sensitiveThrottle)
            router.get('/:id', [QuotesController, 'show'])
            router.put('/:id', [QuotesController, 'update']).use(sensitiveThrottle)
            router.delete('/:id', [QuotesController, 'destroy']).use(sensitiveThrottle)
            router.patch('/:id/status', [QuotesController, 'updateStatus']).use(sensitiveThrottle)
            router.post('/:id/duplicate', [QuotesController, 'duplicate']).use(sensitiveThrottle)
          })
          .prefix('/quotes')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
  .use(globalThrottle) // Apply global rate limiting to all API routes
