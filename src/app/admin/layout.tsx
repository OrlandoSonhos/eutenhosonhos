'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ChartBarIcon, 
  TicketIcon, 
  ShoppingBagIcon, 
  UsersIcon,
  HomeIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
  { name: 'Produtos', href: '/admin/produtos', icon: CubeIcon },
  { name: 'Cupons', href: '/admin/cupons', icon: TicketIcon },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBagIcon },
  { name: 'Usuários', href: '/admin/usuarios', icon: UsersIcon },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
            <div className="mt-3">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Voltar à Loja
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}