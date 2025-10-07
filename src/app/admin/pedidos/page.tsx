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
  payment?: {
    id: string
    status: string
    payment_method: string
    external_id?: string
  }
  items: {
    id: string
    quantity: number
    price_cents: number
    coupon: {
      code: string
      face_value_cents: number
    }
  }[]
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'CANCELLED'>('ALL')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
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

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'PAID': return 'text-green-600 bg-green-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true
    return order.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="mt-2 text-gray-600">Visualize e gerencie todos os pedidos</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'ALL' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'PENDING' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pendentes ({orders.filter(o => o.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'PAID' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pagos ({orders.filter(o => o.status === 'PAID').length})
            </button>
            <button
              onClick={() => setFilter('CANCELLED')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'CANCELLED' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelados ({orders.filter(o => o.status === 'CANCELLED').length})
            </button>
          </div>
        </div>

        {/* Lista de Pedidos */}
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
                  {order.payment && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Pagamento</h4>
                      <div className="text-sm text-gray-600">
                        <p>Método: {order.payment.payment_method}</p>
                        <p>Status: {order.payment.status}</p>
                        {order.payment.external_id && (
                          <p>ID Externo: {order.payment.external_id}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Itens do Pedido */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            Cupom: {item.coupon.code}
                          </p>
                          <p className="text-sm text-gray-600">
                            Valor: {formatCurrency(item.coupon.face_value_cents)} × {item.quantity}
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
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}