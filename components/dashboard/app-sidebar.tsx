"use client"

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Flame,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/lib/auth-context'

interface AppSidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  badge?: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Priorización de Riesgos',
    href: '/dashboard/priorizacion',
    icon: ShieldAlert,
  },
  {
    label: 'Reporte de Peligros',
    href: '/dashboard/reporte',
    icon: BarChart3,
  },
  {
    label: 'Catálogo de Peligros',
    href: '/dashboard/peligros',
    icon: Flame,
  },
  {
    label: 'Configuración',
    href: '#',
    icon: Settings,
    disabled: true,
    badge: 'Próximamente',
    adminOnly: true,
  },
]

export function AppSidebar({ mobileOpen, setMobileOpen }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const isUserAdmin = Boolean(
    user && (
      (user as any).role === 'SUPER_ADMIN' ||
      (user as any).role === 'ADMIN' ||
      user.email?.toLowerCase().includes('admin') ||
      user.nombre?.toLowerCase().includes('admin') ||
      user.cargo?.toLowerCase().includes('admin')
    )
  )

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('sg_sst_sidebar_collapsed')
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('sg_sst_sidebar_collapsed', String(next))
  }

  const handleNavigate = (item: NavItem) => {
    if (item.disabled) return
    setMobileOpen(false)
    router.push(item.href)
  }

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isUserAdmin)

  const renderNavLinks = (collapsed: boolean) => (
    <nav className="flex flex-col gap-1.5 px-3 py-4 flex-1">
      <div
        className={`text-[10px] font-bold uppercase tracking-wider text-[#8aa08f] px-3 mb-1 transition-opacity ${
          collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
        }`}
      >
        Navegación
      </div>

      {visibleNavItems.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(item.href) && item.href !== '#'

        const buttonContent = (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => handleNavigate(item)}
            className={`group relative flex items-center w-full rounded-xl transition-all duration-200 text-left ${
              collapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-2.5'
            } ${
              isActive
                ? 'bg-[#1F7D3E] text-white font-semibold shadow-sm shadow-[#1F7D3E]/20'
                : item.disabled
                ? 'text-[#8aa08f]/60 cursor-not-allowed hover:bg-transparent'
                : 'text-[#5e6b62] hover:text-[#163522] hover:bg-[#f0f9f1] font-medium'
            }`}
          >
            <Icon
              className={`shrink-0 transition-transform duration-200 ${
                collapsed ? 'size-5' : 'size-5'
              } ${
                isActive
                  ? 'text-white'
                  : item.disabled
                  ? 'text-[#8aa08f]/50'
                  : 'text-[#5e6b62] group-hover:text-[#1F7D3E]'
              }`}
            />

            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-sm truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-md bg-[#edf2ed] text-[#8aa08f] border border-[#dce8dc]">
                    {item.badge}
                  </span>
                )}
              </div>
            )}

            {isActive && !collapsed && (
              <span className="w-1.5 h-4 rounded-full bg-white/40 shrink-0" />
            )}
          </button>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={12}
                className="bg-[#163522] text-white border-[#163522] text-xs font-semibold py-1.5 px-3"
              >
                <div className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-white/20 text-white font-normal">
                      {item.badge}
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        }

        return buttonContent
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-[#e2e9e4] shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out z-40 ${
          isCollapsed ? 'w-[72px]' : 'w-[250px]'
        }`}
      >
        {/* Brand / Header */}
        <div
          className={`h-16 border-b border-[#e2e9e4] flex items-center transition-all ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
          }`}
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center min-w-0 overflow-hidden">
                <img
                  src="/matriz-riesgos/csm_logo_long.png"
                  alt="Clínica Santa María"
                  className="h-8 max-w-[170px] object-contain"
                />
              </div>

              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Contraer barra lateral"
                className="size-7 rounded-lg text-[#8aa08f] hover:text-[#163522] hover:bg-[#f0f9f1] flex items-center justify-center transition-colors shrink-0"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Expandir barra lateral"
              className="group relative size-10 rounded-xl bg-[#f0f9f1] hover:bg-[#e4f3e6] border border-[#d1e2d6] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Expandir barra lateral"
            >
              <img
                src="/matriz-riesgos/csm_logo_only.png"
                alt="CSM"
                className="size-6 object-contain"
              />
              <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-white border border-[#d1e2d6] flex items-center justify-center text-[#1F7D3E] shadow-2xs group-hover:bg-[#1F7D3E] group-hover:text-white transition-colors">
                <ChevronRight className="size-2.5" />
              </span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        {renderNavLinks(isCollapsed)}

        {/* Footer info */}
        <div className="p-3 border-t border-[#e2e9e4] bg-[#fbfdfb] flex items-center justify-center">
          {!isCollapsed ? (
            <div className="space-y-1 px-1 w-full">
              <p className="text-[10px] font-bold text-[#163522] uppercase tracking-wide truncate">
                Clínica Santa María S.A.S.
              </p>
              <p className="text-[10px] text-[#8aa08f] leading-tight">
                Sistema de Gestión SG-SST
              </p>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <img
                src="/matriz-riesgos/csm_logo_only.png"
                alt="CSM"
                className="size-5 object-contain opacity-50"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 border-b border-[#e2e9e4] flex items-center justify-between px-4 bg-[#fbfdfb]">
              <img
                src="/matriz-riesgos/csm_logo_long.png"
                alt="Clínica Santa María"
                className="h-8 object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="size-8 rounded-lg text-[#5e6b62] hover:bg-[#f0f9f1] flex items-center justify-center"
              >
                <X className="size-5" />
              </button>
            </div>

            {renderNavLinks(false)}

            <div className="p-4 border-t border-[#e2e9e4] bg-[#fbfdfb]">
              <p className="text-xs font-bold text-[#163522]">Clínica Santa María S.A.S.</p>
              <p className="text-[11px] text-[#8aa08f] mt-0.5">Versión Institucional GTC-45</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
