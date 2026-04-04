'use server'

import { prisma } from '@/lib/prisma'

export type CheckAuthResult = {
  authorized: boolean
  error?: string
}

export async function checkEmailAuthorized(email: string): Promise<CheckAuthResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { active: true },
    })

    if (!user || !user.active) {
      return { authorized: false, error: 'Email não autorizado.' }
    }

    return { authorized: true }
  } catch (err) {
    console.error('Unexpected auth check error:', err)
    return { authorized: false, error: 'Erro ao verificar autorização.' }
  }
}
