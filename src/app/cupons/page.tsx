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
  discountPercent?: number
  isPercentual?: boolean
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
        // Fallback para cupons de exemplo quando a API não funciona
        setCouponTypes([
          {
            id: '1',
            name: 'Cartão 25% de Desconto',
            faceValueCents: 2500,
            salePriceCents: 2000,
            description: 'Cartão de desconto de 25%'
          },
          {
            id: '2',
            name: 'Cartão 50% de Desconto',
            faceValueCents: 5000,
            salePriceCents: 4000,
            description: 'Cartão de desconto de 50%'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCouponTypes()
  }, [])

  const calculateDiscount = (coupon: CouponType) => {
    // Se é um cupom percentual, retorna o percentual direto
    if (coupon.isPercentual && coupon.discountPercent) {
      return coupon.discountPercent
    }
    // Fallback para cupons de valor fixo
    if (coupon.faceValueCents > 0) {
      return Math.round(((coupon.faceValueCents - coupon.salePriceCents) / coupon.faceValueCents) * 100)
    }
    return 0
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
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 justify-items-center max-w-2xl">
          {couponTypes.map((coupon) => {
            const discount = calculateDiscount(coupon)
            const isPurchasing = purchasing === coupon.id
            const savings = coupon.faceValueCents - coupon.salePriceCents

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 ${
                  coupon.faceValueCents === 5000 || coupon.faceValueCents === 2500 ? 'max-w-sm mx-auto w-full' : ''
                }`}
              >
                {/* Card Header - Design baseado no percentual de desconto */}
                {coupon.isPercentual && coupon.discountPercent === 50 ? (
                  <div className="relative overflow-hidden">
                    <img 
                      src="/uploads/50_.png" 
                      alt="Cartão de 50% de desconto"
                      className="w-full h-52 object-cover rounded-t-xl"
                    />
                  </div>
                ) : coupon.isPercentual && coupon.discountPercent === 25 ? (
                  <div className="relative overflow-hidden">
                    <img 
                      src="/uploads/25_.png" 
                      alt="Cartão de 25% de desconto"
                      className="w-full h-52 object-cover rounded-t-xl"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center relative overflow-hidden discount-card-header" style={{background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'}}>
                    <div className="relative z-10">
                      <div 
                        id={`discount-number-${discount}`}
                        className="text-6xl font-bold mb-2 discount-number" 
                        style={{
                          color: '#000000', 
                          fontWeight: '900',
                          textShadow: 'none',
                          opacity: '1',
                          visibility: 'visible',
                          display: 'block',
                          fontSize: '4rem'
                        }}
                      >
                        {discount}%
                      </div>
                      <div 
                        id={`discount-text-${discount}`}
                        className="text-xl font-semibold discount-text" 
                        style={{
                          color: '#000000', 
                          fontWeight: '700',
                          textShadow: 'none',
                          opacity: '1',
                          visibility: 'visible',
                          display: 'block',
                          fontSize: '1.25rem'
                        }}
                      >
                        DE DESCONTO
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Card Body */}
                <div className="p-6">
                  {coupon.isPercentual && coupon.discountPercent ? (
                    // Design para cupons percentuais
                    <>
                      <div className="text-center mb-6">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {coupon.discountPercent}% de desconto
                        </div>
                        <div className="text-lg text-gray-600">
                          por {formatCurrency(coupon.salePriceCents)}
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Use em qualquer compra
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBuyCoupon(coupon.id)}
                        disabled={isPurchasing}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Comprar
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    // Design padrão para cupons de valor fixo (fallback)
                    <>
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {formatCurrency(coupon.faceValueCents)}
                        </div>
                        <div className="text-lg text-gray-600">
                          por apenas {formatCurrency(coupon.salePriceCents)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBuyCoupon(coupon.id)}
                        disabled={isPurchasing}
                        className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Comprar
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>

        {/* Como funciona */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Como funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span id="step-number-1" className="font-bold text-2xl step-number" style={{color: '#ffffff', fontWeight: '900', display: 'inline-block', fontSize: '1.5rem', opacity: '1', visibility: 'visible', textShadow: 'none', background: 'transparent'}}>1</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Escolha seu cartão</h3>
              <p className="text-gray-600">
                Selecione o valor do cartão de desconto que melhor se adequa às suas necessidades
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span id="step-number-2" className="font-bold text-2xl step-number" style={{color: '#ffffff', fontWeight: '900', display: 'inline-block', fontSize: '1.5rem', opacity: '1', visibility: 'visible', textShadow: 'none', background: 'transparent'}}>2</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Pague com segurança</h3>
              <p className="text-gray-600">
                Pague via PIX, cartão de crédito ou débito através do Mercado Pago com total segurança
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span id="step-number-3" className="font-bold text-2xl step-number" style={{color: '#ffffff', fontWeight: '900', display: 'inline-block', fontSize: '1.5rem', opacity: '1', visibility: 'visible', textShadow: 'none', background: 'transparent'}}>3</span>
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
                Após a compra, você receberá um código por email. No checkout, cole o código no campo "Cartão de Desconto" 
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