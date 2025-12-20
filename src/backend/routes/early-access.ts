// ABOUTME: Early access signup routes.
// ABOUTME: Handles public signup endpoint for early access registration.

import { Elysia, t } from 'elysia'
import { prisma, getClientIp } from '../shared'

const EarlyAccessRequest = t.Object({
  firstName: t.String(),
  email: t.String(),
  discord: t.Optional(t.String()),
  reason: t.Optional(t.String())
})

export const earlyAccessRoutes = new Elysia({ prefix: '/api' })
  // Submit early access signup (public)
  .post('/early-access', async ({ body, request, set }) => {
    const { firstName, email, discord, reason } = body

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      set.status = 400
      return { error: 'Invalid email address' }
    }

    const ip = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent')

    try {
      const signup = await prisma.earlyAccessSignup.create({
        data: {
          firstName,
          email,
          discord: discord || null,
          reason: reason || null,
          ip,
          userAgent
        }
      })

      console.log(`New early access signup: ${signup.id} - ${email}`)

      return {
        success: true as const,
        id: signup.id,
        createdAt: signup.createdAt
      }
    } catch (error) {
      // Check for duplicate email
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        set.status = 409
        return { error: 'This email is already registered' }
      }
      throw error
    }
  }, {
    body: EarlyAccessRequest
  })
