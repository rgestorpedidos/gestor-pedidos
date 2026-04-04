'use client'

import {
    LayoutDashboard,
    UtensilsCrossed,
    Users,
    ChefHat,
    ClipboardList,
    ShieldCheck,
} from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { ROLES, type Role } from '@/lib/roles'
import type { NavGroup as NavGroupType } from './types'

interface AppSidebarProps {
    userRole: Role
    userEmail?: string
}

function buildNavGroups(userRole: Role): NavGroupType[] {
    const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN
    const isGarcom = userRole === ROLES.GARCOM || isAdmin
    const isCozinha = userRole === ROLES.COZINHA || isAdmin

    const groups: NavGroupType[] = []

    if (isAdmin) {
        groups.push({
            title: 'Geral',
            items: [
                {
                    title: 'Dashboard',
                    url: '/admin',
                    icon: LayoutDashboard,
                },
            ],
        })

        groups.push({
            title: 'Administração',
            items: [
                {
                    title: 'Gerenciar Mesas',
                    url: '/admin/mesas',
                    icon: UtensilsCrossed,
                },
                {
                    title: 'Cardápio',
                    url: '/admin/cardapio',
                    icon: ClipboardList,
                },
                {
                    title: 'Usuários',
                    url: '/admin/users',
                    icon: Users,
                },
                ...(userRole === ROLES.SUPERADMIN
                    ? [
                          {
                              title: 'Super Admin',
                              url: '/admin/super',
                              icon: ShieldCheck,
                          },
                      ]
                    : []),
            ],
        })
    }

    const operacionalItems = []
    if (isGarcom) {
        operacionalItems.push({
            title: 'Atendimento (Garçom)',
            url: '/garcom',
            icon: UtensilsCrossed,
        })
    }
    if (isCozinha) {
        operacionalItems.push({
            title: 'Cozinha',
            url: '/cozinha',
            icon: ChefHat,
        })
    }

    if (operacionalItems.length > 0) {
        groups.push({
            title: 'Operacional',
            items: operacionalItems,
        })
    }

    return groups
}

export function AppSidebar({ userRole, userEmail }: AppSidebarProps) {
    const navGroups = buildNavGroups(userRole)

    const userName = userEmail
        ? userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Usuário'

    const sidebarData = {
        user: {
            name: userName,
            email: userEmail || '',
            avatar: '',
        },
        navGroups,
    }

    return (
        <Sidebar collapsible='icon'>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' asChild>
                            <div className='flex items-center gap-2'>
                                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                                    <UtensilsCrossed className='size-4' />
                                </div>
                                <div className='flex flex-col gap-0.5 leading-none'>
                                    <span className='font-semibold'>Gestor Pedidos</span>
                                    <span className='text-xs text-muted-foreground'>v1.0.0</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {sidebarData.navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={sidebarData.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
