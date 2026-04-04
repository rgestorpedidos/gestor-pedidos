import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/lib/roles'

export async function getUserRole(): Promise<Role | null> {
  const session = await getUserSession()
  return session?.role ?? null
}

export async function getUserSession(): Promise<{ role: Role; userId: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, active: true },
  })

  if (!dbUser || !dbUser.active) return null

  return { role: dbUser.role as Role, userId: user.id }
}
