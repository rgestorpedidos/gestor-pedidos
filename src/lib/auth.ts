import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  return user?.role || null
}
