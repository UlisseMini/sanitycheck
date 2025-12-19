// ABOUTME: Early access signup routes.
// ABOUTME: Handles public signup endpoint for early access registration.

import { Router, Request, Response, NextFunction } from 'express';
import { prisma, getClientIp } from '../shared';

const router = Router();

// Submit early access signup (public)
router.post('/early-access', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, email, discord, reason } = req.body;

    if (!firstName || !email) {
      res.status(400).json({ error: 'First name and email are required' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    const signup = await prisma.earlyAccessSignup.create({
      data: {
        firstName,
        email,
        discord: discord || null,
        reason: reason || null,
        ip,
        userAgent
      }
    });

    console.log(`New early access signup: ${signup.id} - ${email}`);

    res.status(201).json({
      success: true,
      id: signup.id,
      createdAt: signup.createdAt
    });
  } catch (error) {
    // Check for duplicate email
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      res.status(409).json({ error: 'This email is already registered' });
      return;
    }
    next(error);
  }
});

export default router;
