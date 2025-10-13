'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Gift, ShoppingCart, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CouponType {
  id: string
  name: string
  faceValueCents: number
  salePriceCents: number
  description: string
}

export default function DiscountCardsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [couponTypes, setCouponTypes] = useState<CouponType[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCouponTypes() {
      try {
        const response = await fetch('/api/coupons/buy')
        const data = await response.json()
        setCouponTypes(data.couponTypes || [])
      } catch (error) {
        console.error('Erro ao carregar tipos de cupons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCouponTypes()
  }, [])

  const handleBuyCoupon = async (couponTypeId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    setPurchasing(couponTypeId)

    try {
      const response = await fetch('/api/coupons/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ couponTypeId })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data?.error || 'Erro ao processar compra'
        throw new Error(errorMessage)
      }

      // Redirecionar para o Mercado Pago
      const checkoutUrl = data.sandboxInitPoint || data.initPoint
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Erro ao comprar cupom:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar compra. Tente novamente.'
      alert(errorMessage)
    } finally {
      setPurchasing(null)
    }
  }

  const calculateDiscount = (faceValue: number, salePrice: number) => {
    return Math.round(((faceValue - salePrice) / faceValue) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-6"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-teal)] to-[var(--primary-teal-dark)] rounded-lg flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cartões de Desconto
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compre cartões de desconto e economize nas suas compras. 
            Use quando quiser, válidos por 30 dias!
          </p>
        </div>

        {/* Cupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {couponTypes.map((coupon) => {
            const discount = calculateDiscount(coupon.faceValueCents, coupon.salePriceCents)
            const isPurchasing = purchasing === coupon.id

            return (
              <div
                key={coupon.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-gradient-to-br from-[var(--primary-teal)] to-[var(--primary-teal-dark)] p-6 text-white text-center">
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(coupon.faceValueCents)}
                  </div>
                  <div className="text-sm opacity-90 mb-4">
                    por apenas {formatCurrency(coupon.salePriceCents)}
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium inline-block">
                    {discount}% OFF
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-6">
                    {coupon.description}
                  </p>
                  
                  <div className="space-y-2 mb-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-success mr-2" />
                      Válido por 30 dias
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-success mr-2" />
                      Use quando quiser
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-success mr-2" />
                      Pagamento seguro
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBuyCoupon(coupon.id)}
                    disabled={isPurchasing}
                    className="w-full btn-primary py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Comprar Agora
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Como funciona */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Como funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--primary-teal-light)]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-[var(--primary-teal)] font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Escolha seu cartão</h3>
              <p className="text-gray-600 text-sm">
                Selecione o valor do cartão de desconto que deseja comprar
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--primary-teal-light)]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-[var(--primary-teal)] font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pague com segurança</h3>
              <p className="text-gray-600 text-sm">
                Pague via PIX ou cartão através do Mercado Pago
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--primary-teal-light)]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-[var(--primary-teal)] font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Use quando quiser</h3>
              <p className="text-gray-600 text-sm">
                Receba o código por email e use em qualquer compra
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}