import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createCouponPreference } from '@/lib/mercadopago'
import { COUPON_TYPES } from '@/lib/coupons'
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
    const couponType = COUPON_TYPES.find(type => type.id === couponTypeId)
    
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
  return NextResponse.json({
    couponTypes: COUPON_TYPES
  })
}