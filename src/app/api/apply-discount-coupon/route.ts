import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

interface SessionUser {
  id: string;
  role: string;
}

interface SessionWithUser {
  user: SessionUser;
}

const applyCouponSchema = z.object({
  orderId: z.string().min(1, 'ID do pedido é obrigatório'),
  couponCode: z.string().min(1, 'Código do cupom é obrigatório'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, couponCode } = applyCouponSchema.parse(body)

    // Buscar o pedido com itens e produtos
    const order = await prismaWithRetry.order.findUnique({
      where: { 
        id: orderId,
        user_id: session.user.id 
      },
      include: {
        order_items: {
          include: {
            product: true
          }
        },
        order_discounts: {
          include: {
            discount_coupon: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o pedido já tem desconto aplicado
    const orderWithDiscounts = order as any
    if (orderWithDiscounts.order_discounts && orderWithDiscounts.order_discounts.length > 0) {
      return NextResponse.json(
        { error: 'Pedido já possui desconto aplicado' },
        { status: 400 }
      )
    }

    // Validar o cupom
    const productIds = orderWithDiscounts.order_items.map((item: any) => item.product_id)
    const validateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/validate-discount-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: couponCode,
        productIds
      })
    })

    const validationResult = await validateResponse.json()

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    const coupon = validationResult.coupon

    // Calcular desconto
    let discountAmount = 0
    
    if (coupon.type === 'AUCTION_50') {
      // Para cupons de leilão, aplicar desconto apenas nos produtos válidos
      const validProductIds = validationResult.validProducts || []
      const validItems = orderWithDiscounts.order_items.filter((item: any) => 
        validProductIds.includes(item.product_id)
      )
      
      const validItemsTotal = validItems.reduce((sum: number, item: any) => 
        sum + (item.price_cents * item.quantity), 0
      )
      
      discountAmount = Math.floor(validItemsTotal * (coupon.discount_percent / 100))
    } else {
      // Para cupons regulares, aplicar em todo o pedido
      discountAmount = Math.floor(order.total_cents * (coupon.discount_percent / 100))
    }

    const finalAmount = Math.max(0, order.total_cents - discountAmount)

    // Aplicar o desconto no banco de dados
    const result = await prismaWithRetry.$transaction(async (tx) => {
        // Atualizar o pedido
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            discount_cents: discountAmount,
            final_cents: finalAmount
          }
        })

        // Registro do desconto aplicado diretamente no pedido

        // Marcar cupom como usado (se necessário)
        // O modelo Coupon atual não tem controle de usos múltiplos

        return { updatedOrder }
      })

    return NextResponse.json({
      success: true,
      order: result.updatedOrder,
      discount: {
        code: coupon.code,
        type: coupon.type,
        discount_percent: coupon.discount_percent,
        discount_amount: discountAmount,
        final_amount: finalAmount
      }
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