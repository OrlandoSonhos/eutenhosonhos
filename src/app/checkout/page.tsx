'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Gift, Check, X, AlertCircle, Truck, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  title: string
  price_cents: number
  quantity: number
  stock: number
}

interface AppliedCoupon {
  code: string
  discount: number
  faceValue: number
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    loadCart()
  }, [status, router])

  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      if (cart.length === 0) {
        router.push('/carrinho')
        return
      }
      setCartItems(cart)
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error)
      router.push('/carrinho')
    } finally {
      setLoading(false)
    }
  }

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price_cents * item.quantity), 0)
  }

  const getShipping = () => {
    const subtotal = getSubtotal()
    return subtotal >= 10000 ? 0 : 1000 // Frete grátis acima de R$ 100
  }

  const getDiscount = () => {
    return appliedCoupon ? appliedCoupon.discount : 0
  }

  const getTotal = () => {
    return Math.max(0, getSubtotal() + getShipping() - getDiscount())
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom')
      return
    }

    setCouponLoading(true)
    setCouponError('')

    try {
      const response = await fetch('/api/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: couponCode.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setCouponError(data.error || 'Erro ao aplicar cupom')
        return
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discount: data.coupon.discount,
        faceValue: data.coupon.faceValue
      })
      setCouponCode('')
      setCouponError('')
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error)
      setCouponError('Erro ao aplicar cupom. Tente novamente.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const processPayment = async () => {
    if (cartItems.length === 0) {
      alert('Carrinho vazio')
      return
    }

    setProcessingPayment(true)

    try {
      const orderData = {
        items: cartItems,
        couponCode: appliedCoupon?.code,
        subtotal: getSubtotal(),
        shipping: getShipping(),
        discount: getDiscount(),
        total: getTotal()
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pedido')
      }

      // Redirecionar para o Mercado Pago
      const checkoutUrl = data.sandboxInitPoint || data.initPoint
      if (checkoutUrl) {
        // Limpar carrinho após criar o pedido
        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('cartUpdated'))
        
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/carrinho"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao carrinho
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            {/* Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Resumo do Pedido
              </h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">IMG</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Quantidade: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.price_cents * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                Cupom de Desconto
              </h2>

              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Cupom aplicado: {appliedCoupon.code}
                        </p>
                        <p className="text-sm text-green-600">
                          Desconto: {formatCurrency(appliedCoupon.discount)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Digite o código do cupom"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {couponLoading ? 'Aplicando...' : 'Aplicar'}
                    </button>
                  </div>

                  {couponError && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {couponError}
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    <Link href="/meus-cupons" className="text-indigo-600 hover:text-indigo-700">
                      Ver meus cupons disponíveis →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Resumo de Valores
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getSubtotal())}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span className={`font-medium ${getShipping() === 0 ? 'text-green-600' : ''}`}>
                    {getShipping() === 0 ? 'Grátis' : formatCurrency(getShipping())}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span className="font-medium">-{formatCurrency(getDiscount())}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatCurrency(getTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Forma de Pagamento
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold mr-3">
                    MP
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Mercado Pago</p>
                    <p className="text-sm text-blue-600">PIX, Cartão de Crédito e Débito</p>
                  </div>
                </div>
              </div>

              <button
                onClick={processPayment}
                disabled={processingPayment || cartItems.length === 0}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Finalizar Compra - {formatCurrency(getTotal())}
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-sm text-gray-500">
                Pagamento seguro processado pelo Mercado Pago
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-medium text-gray-900 mb-3">Compra Segura</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  <span>Dados protegidos com criptografia SSL</span>
                </div>
                <div className="flex items-center">
                  <Truck className="w-4 h-4 text-blue-500 mr-2" />
                  <span>Frete grátis acima de {formatCurrency(10000)}</span>
                </div>
                <div className="flex items-center">
                  <Gift className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Use cupons para economizar ainda mais</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
