import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createCouponPreference } from '@/lib/mercadopago'
import { COUPON_TYPES } from '@/lib/coupons'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const buyCouponSchema = z.object({
  couponTypeId: z.string().min(1, 'Tipo de cupom é obrigatório')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { couponTypeId } = buyCouponSchema.parse(body)

    // Buscar tipo de cupom
    let couponType = COUPON_TYPES.find(type => type.id === couponTypeId)
    
    // Se não encontrou nos tipos estáticos, verificar se é um cupom de desconto
    if (!couponType && couponTypeId.startsWith('discount-')) {
      const discountCouponId = couponTypeId.replace('discount-', '')
      
      const discountCoupon = await prisma.discountCoupon.findFirst({
        where: {
          id: discountCouponId,
          is_active: true
        }
      })
      
      if (discountCoupon) {
         let salePriceCents = discountCoupon.sale_price_cents || 0
         
         // Calcular valores baseados no tipo e preço de venda
         let faceValueCents = salePriceCents
         if (discountCoupon.type === 'PERMANENT_25' && salePriceCents === 0) {
           faceValueCents = 2500 // R$ 25
           salePriceCents = 500   // R$ 5
         } else if (discountCoupon.type === 'SPECIAL_50' && salePriceCents === 0) {
           faceValueCents = 5000  // R$ 50
           salePriceCents = 1000  // R$ 10
         } else if (salePriceCents > 0) {
           faceValueCents = Math.round(salePriceCents * 5) // 5x o preço de venda
         }
        
        couponType = {
          id: couponTypeId,
          name: `Cartão ${discountCoupon.discount_percent}% de Desconto`,
          faceValueCents: faceValueCents,
          salePriceCents: salePriceCents,
          description: `Cartão com ${discountCoupon.discount_percent}% de desconto`
        }
      }
    }
    
    // Se não encontrou nos tipos estáticos nem nos cupons de desconto, verificar se é um cartão pré-pago
    if (!couponType && couponTypeId.startsWith('prepaid-')) {
      const faceValueCents = parseInt(couponTypeId.replace('prepaid-', ''))
      
      const availableCoupon = await prisma.coupon.findFirst({
        where: {
          face_value_cents: faceValueCents,
          status: 'AVAILABLE',
          expires_at: {
            gt: new Date()
          }
        }
      })
      
      if (availableCoupon) {
        couponType = {
          id: couponTypeId,
          name: `Cartão Pré-pago R$ ${(availableCoupon.face_value_cents / 100).toFixed(2)}`,
          faceValueCents: availableCoupon.face_value_cents,
          salePriceCents: availableCoupon.sale_price_cents,
          description: `Cartão pré-pago de R$ ${(availableCoupon.face_value_cents / 100).toFixed(2)}`
        }
      }
    }
    
    if (!couponType) {
      return NextResponse.json(
        { error: 'Tipo de cupom não encontrado' },
        { status: 404 }
      )
    }

    // Criar preferência no Mercado Pago
    const preference = await createCouponPreference(
      couponType.faceValueCents,
      couponType.salePriceCents,
      couponTypeId,
      (session as any).user.email,
      (session as any).user.id
    )

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    })

  } catch (error) {
    console.error('Erro ao criar preferência de cupom:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Buscar cupons de desconto ativos do banco de dados
    const discountCoupons = await prisma.discountCoupon.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        discount_percent: 'asc'
      }
    })

    const couponTypes = []

    // Converter cupons de desconto para o formato esperado pela página
     for (const discountCoupon of discountCoupons) {
       // Para cupons percentuais, o preço de venda é o que o cliente paga pelo cupom
       let salePriceCents = discountCoupon.sale_price_cents || 0
       
       // Definir preços padrão baseados no tipo de cupom
       if (discountCoupon.type === 'PERMANENT_25') {
         if (salePriceCents === 0) {
           salePriceCents = 500   // R$ 5,00 para comprar cupom de 25%
         }
       } else if (discountCoupon.type === 'SPECIAL_50') {
         if (salePriceCents === 0) {
           salePriceCents = 1000  // R$ 10,00 para comprar cupom de 50%
         }
       }
      
      couponTypes.push({
        id: `discount-${discountCoupon.id}`,
        name: `Cupom ${discountCoupon.discount_percent}% de Desconto`,
        faceValueCents: 0, // Não é um vale-compra, é desconto percentual
        salePriceCents: salePriceCents,
        description: `Cupom de ${discountCoupon.discount_percent}% de desconto em qualquer compra`,
        discountCouponId: discountCoupon.id,
        discountPercent: discountCoupon.discount_percent,
        isPercentual: true // Flag para indicar que é desconto percentual
      })
    }

    // Se não encontrou cupons de desconto ativos, retornar os tipos estáticos como fallback
    if (couponTypes.length === 0) {
      const limitedTypes = COUPON_TYPES.filter(type => 
        type.id === 'cupom25' || type.id === 'cupom50'
      )
      return NextResponse.json({
        couponTypes: limitedTypes
      })
    }

    return NextResponse.json({
      couponTypes: couponTypes
    })
  } catch (error) {
    console.error('Erro ao buscar cartões de desconto:', error)
    // Em caso de erro, retornar apenas os tipos limitados
    const limitedTypes = COUPON_TYPES.filter(type => 
      type.id === 'cupom25' || type.id === 'cupom50'
    )
    return NextResponse.json({
      couponTypes: limitedTypes
    })
  }
}