import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const applyCouponSchema = z.object({
  code: z.string().min(1, 'Código do cupom é obrigatório'),
  order_id: z.string().min(1, 'ID do pedido é obrigatório')
})

// POST - Aplicar cupom de desconto a um pedido
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code, order_id } = applyCouponSchema.parse(body)
    const userId = (session as any).user.id

    // Verificar se o pedido existe e pertence ao usuário
    const order = await prismaWithRetry.order.findFirst({
      where: {
        id: order_id,
        user_id: userId,
        status: 'PENDING' // Só pode aplicar cupom em pedidos pendentes
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado ou não pode ser modificado' },
        { status: 404 }
      )
    }

    // Verificar se já existe um desconto aplicado neste pedido
    if (order.discount_cents > 0) {
      return NextResponse.json(
        { error: 'Já existe um cupom aplicado neste pedido' },
        { status: 400 }
      )
    }

    // Buscar cupom comprado pelo usuário
    const coupon = await prismaWithRetry.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        buyer_id: userId,
        status: 'AVAILABLE'
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupom não encontrado ou já foi usado' },
        { status: 400 }
      )
    }

    // Verificar se o cupom está disponível
    if (coupon.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Cupom não está disponível' },
        { status: 400 }
      )
    }

    // Verificar se o cupom expirou
    const now = new Date()
    if (coupon.expires_at && now > coupon.expires_at) {
      return NextResponse.json(
        { error: 'Cupom expirado' },
        { status: 400 }
      )
    }

    // Calcular desconto baseado no valor do cupom
    const discount_amount = coupon.face_value_cents
    const new_total = Math.max(0, order.total_cents - discount_amount)

    // Aplicar o cupom em uma transação
    const result = await prismaWithRetry.$transaction(async (tx) => {
      // Marcar o cupom como usado
      const updatedCoupon = await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          status: 'USED',
          used_at: new Date(),
          used_in_order_id: order_id,
          updated_at: new Date()
        }
      })

      // Atualizar o total do pedido
      const updatedOrder = await tx.order.update({
        where: { id: order_id },
        data: {
          total_cents: new_total,
          discount_cents: discount_amount
        }
      })

      return { coupon: updatedCoupon, updatedOrder }
    })

    return NextResponse.json({
      success: true,
      message: 'Cupom aplicado com sucesso',
      coupon: {
        code: coupon.code,
        face_value_cents: coupon.face_value_cents
      },
      discount_amount,
      new_total,
      savings: discount_amount
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao aplicar cupom:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}