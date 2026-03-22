'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  ChefHat,
  LogOut,
  Moon,
  Sun,
  Menu,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    title: 'Gerenciar Mesas',
    href: '/admin/mesas',
    icon: UtensilsCrossed,
    roles: ['ADMIN'],
  },
  {
    title: 'Cardápio',
    href: '/admin/cardapio',
    icon: ClipboardList,
    roles: ['ADMIN'],
  },
  {
    title: 'Usuários',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Atendimento (Garçom)',
    href: '/garcom',
    icon: UtensilsCrossed,
    roles: ['GARCOM', 'ADMIN'],
  },
  {
    title: 'Cozinha',
    href: '/cozinha',
    icon: ChefHat,
    roles: ['COZINHA', 'ADMIN'],
  },
]

export function AppSidebar({ userRole }: { userRole: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Sidebar className="border-r border-border/40 bg-background">
      <SidebarHeader className="flex h-16 items-center border-b border-border/40 px-6">
        <div className="flex items-center gap-2 font-bold text-primary">
          <UtensilsCrossed className="h-6 w-6" />
          <span>Gestor Pedidos</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                className={cn(
                  'w-full justify-start gap-3 rounded-lg px-3 py-2 transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted font-medium'
                )}
              >
                <a href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
