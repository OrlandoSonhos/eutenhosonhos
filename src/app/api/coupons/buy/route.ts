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
    // Buscar cartões pré-pagos disponíveis
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
      }
    })

    // Se não há cartões no banco, retornar os tipos estáticos
    if (availableCoupons.length === 0) {
      return NextResponse.json({
        couponTypes: COUPON_TYPES
      })
    }

    // Agrupar por valor e criar tipos de cupom únicos
    const uniqueValues = [...new Set(availableCoupons
      .filter(coupon => coupon.face_value_cents != null && coupon.face_value_cents > 0)
      .map(coupon => coupon.face_value_cents)
    )]
    
    const couponTypes = uniqueValues.map(faceValueCents => {
      const coupon = availableCoupons.find(c => c.face_value_cents === faceValueCents)
      return {
        id: `prepaid-${faceValueCents}`,
        name: `Cartão Pré-pago R$ ${(faceValueCents / 100).toFixed(2)}`,
        faceValueCents: faceValueCents,
        salePriceCents: coupon?.sale_price_cents || 0,
        description: `Cartão pré-pago de R$ ${(faceValueCents / 100).toFixed(2)} por apenas R$ ${((coupon?.sale_price_cents || 0) / 100).toFixed(2)}`
      }
    })

    // Garantir que todos os objetos tenham ID
    const validCouponTypes = couponTypes.filter(coupon => coupon.id && coupon.id.length > 0)

    return NextResponse.json({
      couponTypes: validCouponTypes
    })
  } catch (error) {
    console.error('Erro ao buscar cartões pré-pagos:', error)
    // Em caso de erro, retornar os tipos estáticos
    return NextResponse.json({
      couponTypes: COUPON_TYPES
    })
  }
}