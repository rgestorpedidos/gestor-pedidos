import { AppSidebar } from '@/components/app/sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getUserRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role = await getUserRole()

  if (role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/30">
        <AppSidebar userRole={role} />
        <main className="flex-1 overflow-x-hidden pt-4 px-6 relative">
          <SidebarTrigger className="absolute top-4 left-4 lg:hidden" />
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
