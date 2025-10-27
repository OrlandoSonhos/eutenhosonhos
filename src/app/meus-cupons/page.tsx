'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Gift, Copy, Check, Clock, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  face_value_cents: number
  sale_price_cents: number
  status: 'AVAILABLE' | 'USED' | 'EXPIRED'
  expires_at: string
  used_at?: string
  created_at: string
  // Campos para cupons percentuais
  discount_percent?: number
  is_percentual?: boolean
  type?: string
}

export default function MyDiscountCardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchMyCoupons()
    }
  }, [status, router])

  const fetchMyCoupons = async () => {
    try {
      const response = await fetch('/api/coupons/my')
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const calculateDiscount = (coupon: Coupon) => {
    // Se for cupom percentual, retorna o desconto direto
    if (coupon.is_percentual && coupon.discount_percent) {
      return coupon.discount_percent
    }
    
    // Para cupons de valor fixo (antigos)
    const faceValue = coupon.face_value_cents
    const salePrice = coupon.sale_price_cents
    
    if (faceValue === 0 || salePrice === 0) return 0
    return Math.round(((faceValue - salePrice) / faceValue) * 100)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Disponível',
          color: 'text-success bg-success',
          icon: Check
        }
      case 'USED':
        return {
          label: 'Usado',
          color: 'text-gray-600 bg-gray-100',
          icon: Check
        }
      case 'EXPIRED':
        return {
          label: 'Expirado',
          color: 'text-error bg-error',
          icon: X
        }
      default:
        return {
          label: 'Desconhecido',
          color: 'text-gray-600 bg-gray-100',
          icon: Clock
        }
    }
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-teal)] to-[var(--primary-teal-dark)] rounded-lg flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meus Cartões
          </h1>
          <p className="text-gray-600">
            Gerencie seus cartões de desconto
          </p>
        </div>

        {/* Cupons List */}
        {coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cartão encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Você ainda não possui cartões de desconto. Que tal comprar alguns?
            </p>
            <button
              onClick={() => router.push('/cupons')}
              className="btn-primary px-6 py-3 rounded-lg font-medium transition-all"
            >
              Comprar Cartões
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => {
              const statusInfo = getStatusInfo(coupon.status)
              const StatusIcon = statusInfo.icon
              const isExpired = new Date(coupon.expires_at) < new Date()
              const discount = calculateDiscount(coupon)

              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Lado esquerdo - Imagem do cartão */}
                    <div className="flex-shrink-0 sm:w-48 md:w-56 lg:w-64">
                      <div className="h-48 sm:h-full bg-gradient-to-br from-[var(--primary-teal)] to-[var(--primary-teal-dark)] rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none flex items-center justify-center relative">
                        {/* Imagem específica do cartão */}
                        {((coupon.is_percentual && coupon.discount_percent === 50) || coupon.face_value_cents === 5000) && (
                          <img 
                            src="/uploads/50_.png" 
                            alt="Cartão de 50% de desconto"
                            className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain"
                          />
                        )}
                        {((coupon.is_percentual && coupon.discount_percent === 20) || coupon.face_value_cents === 2000) && (
                          <img 
                            src="/uploads/20_.png" 
                            alt="Cartão de 20% de desconto"
                            className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain"
                          />
                        )}
                        {/* Ícone padrão se não houver imagem específica */}
                        {!((coupon.is_percentual && (coupon.discount_percent === 50 || coupon.discount_percent === 20)) || 
                           coupon.face_value_cents === 5000 || coupon.face_value_cents === 2000) && (
                          <Gift className="w-20 h-20 sm:w-24 sm:h-24 text-white" />
                        )}
                        
                        {/* Badge de desconto sobreposto */}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <span className="text-xs font-bold text-[var(--primary-teal)]">
                            {coupon.is_percentual 
                              ? `${coupon.discount_percent}%`
                              : `${calculateDiscount(coupon)}%`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lado direito - Conteúdo */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex flex-col h-full">
                        {/* Header com título e status */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                          <div className="mb-2 sm:mb-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              {coupon.is_percentual 
                                ? `${coupon.discount_percent}% de desconto`
                                : formatCurrency(coupon.face_value_cents)
                              }
                            </h3>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} self-start`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {statusInfo.label}
                          </div>
                        </div>
                        
                        {/* Informações do cupom */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Código:</span>
                            <div className="flex items-center mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm sm:text-base">
                                {coupon.code}
                              </code>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Copiar código"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="w-4 h-4 text-success" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium">Válido até:</span>
                            <div className={`mt-1 ${isExpired ? 'text-error' : ''}`}>
                              {formatDate(coupon.expires_at)}
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium">Comprado em:</span>
                            <div className="mt-1">
                              {formatDate(coupon.created_at)}
                            </div>
                          </div>
                          
                          {coupon.used_at && (
                            <div>
                              <span className="font-medium">Usado em:</span>
                              <div className="mt-1">
                                {formatDate(coupon.used_at)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Botão de ação */}
                        {coupon.status === 'AVAILABLE' && !isExpired && (
                          <div className="mt-auto">
                            <button
                              onClick={() => router.push('/')}
                              className="w-full sm:w-auto bg-[var(--primary-teal)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--primary-teal-dark)] transition-colors shadow-md hover:shadow-lg"
                            >
                              Usar Cartão
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Como usar */}
        {coupons.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Como usar seus cartões
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Copie o código do cartão</p>
              <p>• Cole no checkout para aplicar o desconto</p>
              <p>• Cartões expiram após 30 dias da compra</p>
              <p>• Cada cartão pode ser usado apenas uma vez</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}