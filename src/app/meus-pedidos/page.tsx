'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Eye,
  RefreshCw
} from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price_cents: number
  product: {
    id: string
    title: string
    images: string // JSON string contendo array de imagens
  }
}

interface Order {
  id: string
  status: string
  total_cents: number
  shipping_cents: number
  created_at: string
  tracking_code?: string
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  order_items: OrderItem[]
}

interface TrackingEvent {
  date: string
  time: string
  location: string
  description: string
  status: string
}

interface TrackingInfo {
  code: string
  status: string
  events: TrackingEvent[]
  lastUpdate: string
}

export default function MeusPedidos() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [trackingInfo, setTrackingInfo] = useState<{ [key: string]: TrackingInfo }>({})
  const [trackingLoading, setTrackingLoading] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/my-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackOrder = async (orderId: string, trackingCode?: string) => {
    if (!trackingCode) return

    setTrackingLoading(prev => ({ ...prev, [orderId]: true }))
    
    try {
      const response = await fetch('/api/shipping/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          trackingCode: trackingCode 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTrackingInfo(prev => ({ ...prev, [orderId]: data.tracking }))
      }
    } catch (error) {
      console.error('Erro ao rastrear pedido:', error)
    } finally {
      setTrackingLoading(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'SHIPPED':
        return <Truck className="w-5 h-5 text-blue-500" />
      case 'DELIVERED':
        return <Package className="w-5 h-5 text-green-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Aguardando Pagamento'
      case 'PAID':
        return 'Pago'
      case 'SHIPPED':
        return 'Enviado'
      case 'DELIVERED':
        return 'Entregue'
      default:
        return status
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="mt-2 text-gray-600">Acompanhe seus pedidos e rastreie suas entregas</p>
        </div>

        {/* Lista de Pedidos */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mb-6">Você ainda não fez nenhum pedido.</p>
            <Link
              href="/produtos"
              className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
            >
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Header do Pedido */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(order.total_cents)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {getStatusText(order.status)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Itens do Pedido</h4>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img
                          src={(() => {
                            try {
                              const images = JSON.parse(item.product.images || '[]')
                              return images[0] || '/placeholder-product.svg'
                            } catch {
                              return '/placeholder-product.svg'
                            }
                          })()} 
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.product.title}</h5>
                          <p className="text-sm text-gray-500">
                            Quantidade: {item.quantity} × {formatPrice(item.price_cents)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.quantity * item.price_cents)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Endereço de Entrega */}
                {order.shipping_address && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Endereço de Entrega
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.shipping_address}, {order.shipping_city} - {order.shipping_state}
                    </p>
                    {order.shipping_cents > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Frete: {formatPrice(order.shipping_cents)}
                      </p>
                    )}
                  </div>
                )}

                {/* Rastreamento */}
                {order.tracking_code && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Rastreamento
                      </h4>
                      <button
                        onClick={() => trackOrder(order.id, order.tracking_code)}
                        disabled={trackingLoading[order.id]}
                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        {trackingLoading[order.id] ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        {trackingLoading[order.id] ? 'Rastreando...' : 'Rastrear'}
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      Código: <span className="font-mono font-medium">{order.tracking_code}</span>
                    </p>

                    {/* Informações de Rastreamento */}
                    {trackingInfo[order.id] && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Status da Entrega</h5>
                          <span className="text-sm text-gray-500">
                            Atualizado em: {new Date(trackingInfo[order.id].lastUpdate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {trackingInfo[order.id].events.map((event, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{event.date} às {event.time}</span>
                                  {event.location && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-600">{event.location}</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-gray-900 mt-1">{event.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}