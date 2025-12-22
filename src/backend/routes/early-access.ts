// ABOUTME: Early access signup routes.
// ABOUTME: Handles public signup endpoint for early access registration.

import { Elysia, t } from 'elysia'
import { getClientIp } from '../shared'
import { db, earlyAccessSignups } from '../db'

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

    const [signup] = await db.insert(earlyAccessSignups).values({
      firstName,
      email,
      discord: discord || null,
      reason: reason || null,
      ip,
      userAgent
    }).returning()

    if (!signup) {
      throw new Error('Failed to create early access signup')
    }

    console.log(`New early access signup: ${signup.id} - ${email}`)

    return {
      success: true as const,
      id: signup.id,
      createdAt: signup.createdAt
    }
  }, {
    body: EarlyAccessRequest
  })
