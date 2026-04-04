import { AppSidebar } from '@/components/app/sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { getUserRole } from '@/lib/auth'
import { ROLES } from '@/lib/roles'
import type { Role } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const GARCOM_ROLES: Role[] = [ROLES.GARCOM, ROLES.ADMIN, ROLES.SUPERADMIN]

export default async function GarcomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = await getUserRole()

  if (!role || !GARCOM_ROLES.includes(role)) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SidebarProvider>
      <AppSidebar userRole={role!} userEmail={user?.email} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <main className="flex-1 p-4 pt-2">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
