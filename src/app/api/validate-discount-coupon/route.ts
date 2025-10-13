import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  productIds: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, productIds = [] } = validateCouponSchema.parse(body)

    // Buscar o cupom
    const coupon = await prismaWithRetry.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Cupom não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o cupom está disponível
    if (coupon.status !== 'AVAILABLE') {
      return NextResponse.json(
        { valid: false, error: 'Cupom não está disponível' },
        { status: 400 }
      )
    }

    // Verificar se já foi usado
    if (coupon.used_at) {
      return NextResponse.json(
        { valid: false, error: 'Cupom já foi utilizado' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Verificar validade por data
    if (now > coupon.expires_at) {
      return NextResponse.json(
        { valid: false, error: 'Cupom expirado' },
        { status: 400 }
      )
    }

    // Validação específica para cupons de leilão (50%)
    // @ts-ignore – coupon.type is not in the Prisma model yet
    if ((coupon as any).type === 'AUCTION_50' && productIds.length > 0) {
      const products = await prismaWithRetry.product.findMany({
        where: {
          id: { in: productIds },
          is_auction: true
        }
      })

      // Verificar se todos os produtos são de leilão
      if (products.length !== productIds.length) {
        return NextResponse.json(
          { valid: false, error: 'Cupom de 50% válido apenas para produtos de leilão' },
          { status: 400 }
        )
      }

      // Verificar se algum produto está na data de leilão
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const validAuctionProducts = products.filter(product => {
        if (!(product as any).auction_date) return false
        
        const auctionDate = new Date((product as any).auction_date)
        auctionDate.setHours(0, 0, 0, 0)
        
        const auctionEndDate = (product as any).auction_end_date
          ? new Date((product as any).auction_end_date)
          : new Date(auctionDate.getTime() + 24 * 60 * 60 * 1000) // +1 dia se não especificado
        
        auctionEndDate.setHours(23, 59, 59, 999)
        
        return today >= auctionDate && today <= auctionEndDate
      })

      if (validAuctionProducts.length === 0) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'Cupom de 50% válido apenas na data do leilão dos produtos' 
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: (coupon as any).type,
          discount_percent: (coupon as any).discount_percent,
          validProducts: validAuctionProducts.map(p => p.id)
        }
      })
    }

    // Para cupons regulares (25%) - sempre válidos se passaram nas outras validações
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: (coupon as any).type,
        discount_percent: (coupon as any).discount_percent
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao validar cupom:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}