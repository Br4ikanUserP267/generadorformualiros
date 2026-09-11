"use client"

import React from 'react'
import { Menu, BookOpen, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardHeaderProps {
  onOpenMobileSidebar: () => void
  onOpenInstructions: () => void
}

export function DashboardHeader({
  onOpenMobileSidebar,
  onOpenInstructions,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth()

  const userInitial = (user?.nombre || user?.email || 'U')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e2e9e4] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      {/* Left: Mobile sidebar toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir menú"
          className="lg:hidden size-9 rounded-xl border border-[#e2e9e4] flex items-center justify-center text-[#5e6b62] hover:bg-[#f0f9f1] hover:text-[#1F7D3E] transition-colors"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-black text-[#1F7D3E] leading-tight uppercase tracking-wider">
            Sistema de Gestión SG-SST
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#8aa08f] leading-tight font-medium">
            Seguridad y Salud en el Trabajo
          </span>
        </div>
      </div>

      {/* Right: Actions + User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Instructions button */}
        <button
          type="button"
          onClick={onOpenInstructions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#5e6b62] hover:text-[#1F7D3E] bg-white border border-[#e2e9e4] rounded-xl shadow-xs transition-all hover:bg-[#f0f9f1] hover:border-[#d1e2d6]"
        >
          <BookOpen className="size-4 text-[#1F7D3E]" />
          <span className="hidden xs:inline sm:inline">Instrucciones</span>
        </button>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 pl-2 pr-2 sm:pr-3 py-1.5 rounded-full border border-[#e2e9e4] bg-white hover:bg-[#f8faf9] hover:border-[#d1e2d6] transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F7D3E]/20"
            >
              <div className="size-7 sm:size-8 rounded-full bg-[#1F7D3E] text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#163522] leading-none truncate max-w-[130px]">
                  {user?.nombre || 'Usuario'}
                </span>
                {user?.cargo && (
                  <span className="text-[10px] text-[#8aa08f] leading-none mt-0.5 truncate max-w-[130px]">
                    {user.cargo}
                  </span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white border border-[#e2e9e4] rounded-2xl shadow-lg">
            <DropdownMenuLabel className="p-2">
              <p className="text-xs font-bold text-[#163522] leading-tight">{user?.nombre || 'Usuario'}</p>
              <p className="text-[10px] text-[#8aa08f] font-normal truncate mt-0.5">{user?.email}</p>
              {user?.cargo && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-[#f0f9f1] text-[#1F7D3E] text-[9px] font-black uppercase tracking-wider border border-[#d1e2d6]">
                  {user.cargo}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#e2e9e4]" />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl p-2 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
