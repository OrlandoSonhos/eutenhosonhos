'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Tag, CheckCircle, XCircle } from 'lucide-react'

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
  type?: 'REGULAR_25' | 'AUCTION_50'
  discountPercent?: number
}

interface CartDiscountCouponFormProps {
  cartItems: CartItem[]
  onCouponApplied: (couponData: any) => void
  onCouponRemoved: () => void
  appliedCoupon: AppliedCoupon | null
  disabled?: boolean
}

export default function CartDiscountCouponForm({ 
  cartItems,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  disabled = false 
}: CartDiscountCouponFormProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  const calculateDiscount = (coupon: any) => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price_cents * item.quantity), 0)
    
    if (coupon.type === 'AUCTION_50' && coupon.validProducts) {
      // Para cupons de leilão, calcular desconto apenas nos produtos válidos
      const validItemsTotal = cartItems
        .filter(item => coupon.validProducts.includes(item.id))
        .reduce((sum, item) => sum + (item.price_cents * item.quantity), 0)
      
      return Math.floor(validItemsTotal * (coupon.discount_percent / 100))
    } else {
      // Para cupons regulares, aplicar em todo o carrinho
      return Math.floor(subtotal * (coupon.discount_percent / 100))
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage({
        type: 'error',
        text: 'Digite um código de cupom'
      })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const productIds = cartItems.map(item => item.id)
      
      const response = await fetch('/api/validate-discount-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          productIds
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        const discountAmount = calculateDiscount(data.coupon)
        
        const couponData = {
          code: data.coupon.code,
          discount: discountAmount,
          type: data.coupon.type,
          discountPercent: data.coupon.discount_percent,
          validProducts: data.coupon.validProducts
        }

        onCouponApplied(couponData)
        setMessage({
          type: 'success',
          text: `Cupom aplicado! Desconto de ${data.coupon.discount_percent}% (R$ ${(discountAmount / 100).toFixed(2)})`
        })
        setCouponCode('')
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erro ao aplicar cupom'
        })
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error)
      setMessage({
        type: 'error',
        text: 'Erro de conexão. Tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemoved()
    setMessage(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
        <Tag className="w-5 h-5 mr-2" />
        Cupom de Desconto
      </h2>

      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Cupom aplicado: {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-600">
                  Desconto: R$ {(appliedCoupon.discount / 100).toFixed(2)} ({appliedCoupon.discountPercent}%)
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800"
              disabled={disabled}
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="coupon-code">Código do Cupom</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="coupon-code"
                type="text"
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={disabled || isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={disabled || isLoading || !couponCode.trim()}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>
          </div>

          {message && (
            <Alert className={
              message.type === 'success' 
                ? 'border-green-200 bg-green-50' 
                : message.type === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-blue-200 bg-blue-50'
            }>
              <AlertDescription className={
                message.type === 'success' 
                  ? 'text-green-700' 
                  : message.type === 'error'
                  ? 'text-red-700'
                  : 'text-blue-700'
              }>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500">
            <p>• Cupons de 25% são válidos para todos os produtos</p>
            <p>• Cupons de 50% são válidos apenas para produtos de leilão na data específica</p>
          </div>
        </div>
      )}
    </div>
  )
}