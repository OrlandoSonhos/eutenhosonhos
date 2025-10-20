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
    
    // Se não encontrou nos tipos estáticos, verificar se é um cartão pré-pago
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
      (session as any).user.email
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
    // Buscar cartões pré-pagos disponíveis agrupados por valor
    const availableCoupons = await prisma.coupon.findMany({
      where: {
        status: 'AVAILABLE',
        expires_at: {
          gt: new Date()
        }
      },
      select: {
        face_value_cents: true,
        sale_price_cents: true
      },
      distinct: ['face_value_cents']
    })

    // Filtrar cupons com face_value_cents válido e agrupar por valor
    const couponTypeMap = new Map()
    
    availableCoupons
      .filter(coupon => coupon.face_value_cents != null && coupon.face_value_cents > 0)
      .forEach(coupon => {
        const key = coupon.face_value_cents
        if (!couponTypeMap.has(key)) {
        couponTypeMap.set(key, {
          id: `prepaid-${coupon.face_value_cents}`,
          name: `Cartão Pré-pago R$ ${(coupon.face_value_cents / 100).toFixed(2)}`,
          faceValueCents: coupon.face_value_cents,
          salePriceCents: coupon.sale_price_cents,
          description: `Cartão pré-pago de R$ ${(coupon.face_value_cents / 100).toFixed(2)} por apenas R$ ${(coupon.sale_price_cents / 100).toFixed(2)}`
        })
      }
    })
    
    const couponTypes = Array.from(couponTypeMap.values())

    // Se não há cartões no banco, retornar os tipos estáticos como fallback
    if (couponTypes.length === 0) {
      return NextResponse.json({
        couponTypes: COUPON_TYPES
      })
    }

    return NextResponse.json({
      couponTypes
    })
  } catch (error) {
    console.error('Erro ao buscar cartões pré-pagos:', error)
    // Em caso de erro, retornar os tipos estáticos
    return NextResponse.json({
      couponTypes: COUPON_TYPES
    })
  }
}