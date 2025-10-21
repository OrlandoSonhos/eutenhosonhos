'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ShoppingBag, 
  Users, 
  Gift, 
  TrendingUp, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalCoupons: number
  couponsUsed: number
  couponsAvailable: number
  recentOrders: any[]
  recentCoupons: any[]
  monthlyRevenue: any[]
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user && (session.user as any).role !== 'ADMIN') {
      router.push('/')
      return
    }

    if (status === 'authenticated') {
      fetchDashboardStats()
    }
  }, [status, session, router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncOrders = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/sync-orders', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Sincronização concluída: ${data.results.updated} pedidos atualizados`)
        // Recarregar estatísticas
        await fetchDashboardStats()
      } else {
        alert('Erro na sincronização: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao sincronizar pedidos:', error)
      alert('Erro ao sincronizar pedidos')
    } finally {
      setSyncing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Erro ao carregar dados</h2>
          <button 
            onClick={fetchDashboardStats}
            className="mt-4 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary-dark"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="mt-2 text-gray-600">Análise completa de vendas e marketing</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success rounded-lg">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
          </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Receita Total</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-brand-primary" />
          </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total de Pedidos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-brand-accent/10 rounded-lg">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-brand-accent" />
          </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total de Usuários</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning rounded-lg">
            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
          </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Cartões Vendidos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalCoupons}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Cartões Analytics */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Análise de Cartões
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cartões Disponíveis</span>
                <span className="font-semibold text-success">{stats.couponsAvailable}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cartões Utilizados</span>
                <span className="font-semibold text-brand-primary">{stats.couponsUsed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxa de Conversão</span>
                <span className="font-semibold text-brand-accent">
                  {stats.totalCoupons > 0 
                    ? Math.round((stats.couponsUsed / stats.totalCoupons) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Tendência de Vendas
            </h3>
            <div className="text-center py-6 sm:py-8">
              <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500">Gráfico de vendas mensais</p>
              <p className="text-xs sm:text-sm text-gray-400">Implementar com biblioteca de gráficos</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pedidos Recentes</h3>
            </div>
            <div className="p-4 sm:p-6">
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">#{order.id.slice(-8)}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{order.user?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {formatCurrency(order.total_cents)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm sm:text-base">Nenhum pedido encontrado</p>
              )}
            </div>
          </div>

          {/* Recent Coupons */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cartões Recentes</h3>
            </div>
            <div className="p-4 sm:p-6">
              {stats.recentCoupons && stats.recentCoupons.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.recentCoupons.map((coupon: any) => (
                    <div key={coupon.id} className="flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{coupon.code}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{coupon.buyer?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {formatCurrency(coupon.face_value_cents)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">{coupon.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm sm:text-base">Nenhum cupom encontrado</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <button 
              onClick={() => router.push('/admin/products')}
              className="flex items-center justify-center p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="truncate">Gerenciar Produtos</span>
            </button>
            <button 
              onClick={() => router.push('/admin/coupons')}
              className="flex items-center justify-center p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="truncate">Gerenciar Cartões</span>
            </button>
            <button 
              onClick={() => router.push('/admin/users')}
              className="flex items-center justify-center p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="truncate">Gerenciar Usuários</span>
            </button>
            <button 
              onClick={() => router.push('/admin/orders')}
              className="flex items-center justify-center p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="truncate">Ver Relatórios</span>
            </button>
            <button 
              onClick={syncOrders}
              disabled={syncing}
              className="flex items-center justify-center p-3 sm:p-4 border border-green-300 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-sm sm:text-base disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              <span className="truncate">{syncing ? 'Sincronizando...' : 'Sincronizar Pedidos'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}