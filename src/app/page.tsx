import { getUserRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const role = await getUserRole()

  if (!role) {
    redirect('/login')
  }

  if (role === 'ADMIN') {
    redirect('/admin')
  }

  if (role === 'GARCOM') {
    redirect('/garcom')
  }

  if (role === 'COZINHA') {
    redirect('/cozinha')
  }

  redirect('/login')
}
