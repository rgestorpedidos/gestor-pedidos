import { getUserRole } from '@/lib/auth'
import { ROLES } from '@/lib/roles'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const role = await getUserRole()

  if (!role) redirect('/login')

  if (role === ROLES.SUPERADMIN) redirect('/admin')
  if (role === ROLES.ADMIN) redirect('/admin')
  if (role === ROLES.GARCOM) redirect('/garcom')
  if (role === ROLES.COZINHA) redirect('/cozinha')

  redirect('/login')
}
