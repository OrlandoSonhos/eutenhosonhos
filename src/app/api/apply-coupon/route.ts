import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { validateCoupon } from '@/lib/coupons'
import { z } from 'zod'

const applyCouponSchema = z.object({
  code: z.string().min(1, 'Código do cupom é obrigatório'),
  orderId: z.string().optional()
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
    const { code } = applyCouponSchema.parse(body)

    const validation = await validateCoupon(code)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: validation.coupon!.code,
        discount: validation.coupon!.face_value_cents,
        faceValue: validation.coupon!.face_value_cents
      }
    })

  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    
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
