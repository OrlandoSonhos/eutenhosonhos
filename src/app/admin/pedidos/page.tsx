'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Order {
  id: string
  total_cents: number
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  created_at: string
  user: {
    name: string
    email: string
  }
  payments?: {
    id: string
    status: string
    method: string
    mp_payment_id?: string
  }[]
  order_items: {
    id: string
    quantity: number
    price_cents: number
    product: {
      title: string
      price_cents: number
    }
  }[]
  used_coupons: {
    code: string
    face_value_cents: number
  }[]
}

interface DiscountCouponPurchase {
  id: string
  code: string
  created_at: string
  buyer: {
    id: string
    name: string
    email: string
  }
  coupon_type: string
  discount_percent: number
  sale_price_cents: number
  status: string
  used_at?: string
  expires_at?: string
  order_id?: string
  order_status?: string
}

interface DailyReport {
  date: string
  summary: {
    total_purchases: number
    total_revenue_cents: number
    purchases_by_type: Record<string, { count: number; revenue: number; percentage: number }>
  }
  purchases: DiscountCouponPurchase[]
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'CANCELLED'>('ALL')
  const [activeTab, setActiveTab] = useState<'orders' | 'discount-coupons'>('orders')
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      redirect('/auth/signin')
    }
    fetchOrders()
  }, [session, status])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyReport = async (date: string) => {
    setReportLoading(true)
    try {
      const response = await fetch(`/api/admin/discount-coupon-purchases/daily?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setDailyReport(data)
      } else {
        console.error('Erro ao buscar relatório diário')
      }
    } catch (error) {
      console.error('Erro ao buscar relatório diário:', error)
    } finally {
      setReportLoading(false)
    }
  }

  // Buscar relatório quando a aba de cartões de desconto for ativada
  useEffect(() => {
    if (activeTab === 'discount-coupons' && !dailyReport) {
      fetchDailyReport(selectedDate)
    }
  }, [activeTab, selectedDate])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-warning bg-warning'
    case 'PAID': return 'text-success bg-success'
    case 'CANCELLED': return 'text-error bg-error'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente'
      case 'PAID': return 'Pago'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  const getCouponTypeText = (type: string) => {
    switch (type) {
      case 'PERMANENT_25': return 'Cartão 25%'
      case 'SPECIAL_50': return 'Cartão 50%'
      default: return type
    }
  }

  const getCouponStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONÍVEL': return 'text-green-700 bg-green-100'
      case 'USADO': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true
    return order.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos e Cartões</h1>
          <p className="mt-2 text-gray-600">Visualize e gerencie pedidos e relatórios de cartões de desconto</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pedidos
              </button>
              <button
                onClick={() => setActiveTab('discount-coupons')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discount-coupons'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cartões de Desconto
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'orders' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'ALL' 
                      ? 'bg-brand-primary text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'PENDING' 
                      ? 'bg-warning text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pendentes ({orders.filter(o => o.status === 'PENDING').length})
                </button>
                <button
                  onClick={() => setFilter('PAID')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'PAID' 
                      ? 'bg-success text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pagos ({orders.filter(o => o.status === 'PAID').length})
                </button>
                <button
                  onClick={() => setFilter('CANCELLED')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'CANCELLED' 
                      ? 'bg-error text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancelados ({orders.filter(o => o.status === 'CANCELLED').length})
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'discount-coupons' && (
          <>
            {/* Controles do Relatório */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Relatório
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      fetchDailyReport(e.target.value)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => fetchDailyReport(selectedDate)}
                    disabled={reportLoading}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
                  >
                    {reportLoading ? 'Carregando...' : 'Atualizar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumo do Relatório */}
            {dailyReport && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total de Compras</h3>
                  <p className="text-3xl font-bold text-brand-primary">{dailyReport.summary.total_purchases}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Receita Total</h3>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(dailyReport.summary.total_revenue_cents)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tipos de Cartões</h3>
                  <div className="space-y-1">
                    {Object.entries(dailyReport.summary.purchases_by_type).map(([type, data]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span>{getCouponTypeText(type)}</span>
                        <span className="font-medium">{data.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Lista de Pedidos */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pedido #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatCurrency(order.total_cents)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informações do Cliente */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{order.user.name}</p>
                        <p>{order.user.email}</p>
                      </div>
                    </div>

                    {/* Informações do Pagamento */}
                    {order.payments && order.payments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Pagamento</h4>
                        <div className="text-sm text-gray-600">
                          <p>Método: {order.payments[0].method}</p>
                          <p>Status: {order.payments[0].status}</p>
                          {order.payments[0].mp_payment_id && (
                            <p>ID Externo: {order.payments[0].mp_payment_id}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Itens do Pedido */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Preço unitário: {formatCurrency(item.price_cents)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(item.price_cents * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cupons Usados */}
                  {order.used_coupons && order.used_coupons.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Cupons Usados</h4>
                      <div className="space-y-2">
                        {order.used_coupons.map((coupon, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="font-medium text-gray-900">
                                Código: {coupon.code}
                              </p>
                              <p className="text-sm text-gray-600">
                                Valor: {formatCurrency(coupon.face_value_cents)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500">Nenhum pedido encontrado</p>
              </div>
            )}
          </div>
        )}

        {/* Tabela de Compras de Cartões de Desconto */}
        {activeTab === 'discount-coupons' && dailyReport && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Compras de Cartões de Desconto - {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Cartão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyReport.purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{purchase.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.buyer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.buyer.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCouponTypeText(purchase.coupon_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(purchase.sale_price_cents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCouponStatusColor(purchase.status)}`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(purchase.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dailyReport.purchases.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma compra de cartão de desconto encontrada para esta data.</p>
              </div>
            )}
          </div>
        )}

        {/* Loading state para relatório */}
        {activeTab === 'discount-coupons' && reportLoading && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando relatório...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}