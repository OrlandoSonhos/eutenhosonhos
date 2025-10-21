'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Gift, ShoppingCart, Check, Star, Zap, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CouponType {
  id: string
  name: string
  faceValueCents: number
  salePriceCents: number
  description: string
  image_url?: string
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

  const calculateDiscount = (faceValue: number, salePrice: number) => {
    return Math.round(((faceValue - salePrice) / faceValue) * 100)
  }

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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ couponTypeId }),
      })

      const data = await response.json()

      if (response.ok && data.initPoint) {
        window.location.href = data.initPoint
      } else {
        console.error('Erro ao processar compra:', data.error)
      }
    } catch (error) {
      console.error('Erro ao comprar cupom:', error)
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cartões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {couponTypes.map((coupon) => {
            const discount = calculateDiscount(coupon.faceValueCents, coupon.salePriceCents)
            const isPurchasing = purchasing === coupon.id
            const savings = coupon.faceValueCents - coupon.salePriceCents

            return (
              <div
                key={coupon.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-brand-primary to-brand-primary-dark p-8 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                  
                  <div className="relative z-10">
                    <div className="text-4xl font-bold mb-2">
                      {formatCurrency(coupon.faceValueCents)}
                    </div>
                    <div className="text-lg opacity-90 mb-3">
                      por apenas <span className="font-bold text-2xl">{formatCurrency(coupon.salePriceCents)}</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium inline-block">
                      {discount}% OFF
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-green-600 font-semibold text-lg mb-2">
                      Você economiza {formatCurrency(savings)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {coupon.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      Válido por 30 dias após a compra
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      Use em qualquer produto da loja
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      Ativação automática após pagamento
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBuyCoupon(coupon.id)}
                    disabled={isPurchasing}
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
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
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Como funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Escolha seu cartão</h3>
              <p className="text-gray-600">
                Selecione o valor do cartão de desconto que melhor se adequa às suas necessidades
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Pague com segurança</h3>
              <p className="text-gray-600">
                Pague via PIX, cartão de crédito ou débito através do Mercado Pago com total segurança
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Use quando quiser</h3>
              <p className="text-gray-600">
                Receba o código por email instantaneamente e use em qualquer compra durante 30 dias
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6 max-w-4xl mx-auto">
            <details className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
              <summary className="font-semibold text-lg cursor-pointer text-brand-primary hover:text-brand-primary-dark transition-colors">
                Como posso usar meu cartão de desconto?
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Após a compra, você receberá um código por email. No checkout, cole o código no campo "Cupom de Desconto" 
                e o valor será automaticamente descontado do total da sua compra.
              </p>
            </details>
            <details className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
              <summary className="font-semibold text-lg cursor-pointer text-brand-primary hover:text-brand-primary-dark transition-colors">
                Por quanto tempo o cartão é válido?
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Todos os cartões de desconto são válidos por 30 dias a partir da data de compra. 
                Após esse período, o cartão expira e não pode mais ser utilizado.
              </p>
            </details>
            <details className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
              <summary className="font-semibold text-lg cursor-pointer text-brand-primary hover:text-brand-primary-dark transition-colors">
                Posso usar múltiplos cartões na mesma compra?
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Atualmente, você pode usar apenas um cartão de desconto por compra. 
                Escolha o cartão que oferece o melhor benefício para sua compra.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}