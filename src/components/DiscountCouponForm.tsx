'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Tag, CheckCircle, XCircle } from 'lucide-react'

interface DiscountCouponFormProps {
  orderId: string
  onDiscountApplied: (discount: any) => void
  disabled?: boolean
}

export default function DiscountCouponForm({ 
  orderId, 
  onDiscountApplied, 
  disabled = false 
}: DiscountCouponFormProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)

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
      const response = await fetch('/api/apply-discount-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          couponCode: couponCode.toUpperCase()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAppliedDiscount(data.discount)
        setMessage({
          type: 'success',
          text: `Cupom aplicado! Desconto de ${data.discount.discount_percent}% (R$ ${(data.discount.discount_amount / 100).toFixed(2)})`
        })
        onDiscountApplied(data.discount)
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon()
    }
  }

  if (appliedDiscount) {
    return (
      <div className="space-y-4 p-4 bg-success border border-success rounded-lg">
          <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Cupom Aplicado</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Código:</span>
            <span className="font-mono font-medium">{appliedDiscount.code}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span className="capitalize">
              {appliedDiscount.type === 'AUCTION_50' ? 'Leilão 50%' : 'Regular 25%'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Desconto:</span>
            <span className="font-medium text-success">
              -{appliedDiscount.discount_percent}% (R$ {(appliedDiscount.discount_amount / 100).toFixed(2)})
            </span>
          </div>
          <div className="flex justify-between font-medium text-lg border-t pt-2">
            <span>Total Final:</span>
            <span className="text-success">
              R$ {(appliedDiscount.final_amount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coupon-code" className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Cupom de Desconto
        </Label>
        <div className="flex gap-2">
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
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Aplicando...
              </>
            ) : (
              'Aplicar'
            )}
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={`${
          message.type === 'success' 
            ? 'border-success bg-success'
        : message.type === 'error'
        ? 'border-error bg-error'
        : 'border-brand-primary bg-brand-primary'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
            {message.type === 'error' && <XCircle className="h-4 w-4 text-error" />}
            <AlertDescription className={`${
              message.type === 'success' 
                ? 'text-success'
                : message.type === 'error'
                ? 'text-error'
                : 'text-brand-primary'
            }`}>
              {message.text}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Cupons disponíveis:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>25% OFF:</strong> Válido para todos os produtos, sem restrição de data</li>
          <li><strong>50% OFF:</strong> Válido apenas para produtos de leilão nas datas específicas</li>
        </ul>
      </div>
    </div>
  )
}