'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

interface Order {
  id: string
  total_cents: number
  status: string
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    price_cents: number
    product: {
      id: string
      title: string
      images: string
    }
  }>
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    } else {
      setLoading(false)
    }
  }, [orderId])

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Erro ao buscar pedido:', error)
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

  const getFirstImage = (imagesJson: string) => {
    try {
      const images = JSON.parse(imagesJson)
      return Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder-product.jpg'
    } catch {
      return '/placeholder-product.jpg'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header de Sucesso */}
          <div className="text-center mb-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pedido Realizado com Sucesso!
            </h1>
            <p className="text-gray-600">
              Seu pedido foi processado e você receberá um e-mail de confirmação em breve.
            </p>
          </div>

          {/* Detalhes do Pedido */}
          {order && (
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Pedido #{order.id.slice(-8)}
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {order.status === 'PENDING' ? 'Aguardando Pagamento' : order.status}
                </span>
              </div>

              {/* Itens do Pedido */}
              <div className="space-y-4 mb-6">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={getFirstImage(item.product.images)}
                      alt={item.product.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.title}</h3>
                      <p className="text-gray-600">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.price_cents * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(order.total_cents)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/produtos"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Continuar Comprando
            </Link>
            <Link
              href="/meus-pedidos"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ver Meus Pedidos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Próximos Passos:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Você receberá um e-mail de confirmação com os detalhes do pedido</li>
              <li>• Acompanhe o status do seu pedido na seção &quot;Meus Pedidos&quot;</li>
              <li>• Em caso de dúvidas, entre em contato conosco</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}