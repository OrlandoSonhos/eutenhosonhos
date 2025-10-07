import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateCoupon, applyCoupon } from '@/lib/coupons'
import { createOrderPreference } from '@/lib/mercadopago'
import { formatCurrency } from '@/lib/utils'
import { z } from 'zod'

const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    price_cents: z.number(),
    quantity: z.number().min(1),
    stock: z.number()
  })),
  couponCode: z.string().optional(),
  subtotal: z.number(),
  shipping: z.number(),
  discount: z.number(),
  total: z.number()
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
    const orderData = createOrderSchema.parse(body)

    // Verificar se todos os produtos existem e têm estoque suficiente
    for (const item of orderData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.title} não encontrado` },
          { status: 400 }
        )
      }

      if (!product.active) {
        return NextResponse.json(
          { error: `Produto ${item.title} não está disponível` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${item.title}. Disponível: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    // Validar cupom se fornecido
    let coupon = null
    if (orderData.couponCode) {
      const couponValidation = await validateCoupon(orderData.couponCode)
      if (!couponValidation.valid) {
        return NextResponse.json(
          { error: couponValidation.error },
          { status: 400 }
        )
      }
      coupon = couponValidation.coupon
    }

    // Criar o pedido no banco de dados
    const order = await prisma.order.create({
      data: {
        user_id: (session as any).user.id,
        status: 'PENDING',
        total_cents: orderData.total,
        order_items: {
          create: orderData.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price_cents: item.price_cents
          }))
        }
      },
      include: {
        order_items: {
          include: {
            product: true
          }
        }
      }
    })

    // Criar preferência no Mercado Pago
    const preference = await createOrderPreference(
      orderData.items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price_cents: item.price_cents
      })),
      (session as any).user.email,
      order.id
    )

    // Aplicar cupom se fornecido
    if (coupon) {
      await applyCoupon(coupon.code, order.id)
    }

    // Salvar o ID da preferência nos metadados para referência futura
    // (O campo mp_preference_id não existe no schema atual)

    return NextResponse.json({
      success: true,
      order_id: order.id,
      checkout_url: preference.init_point,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    })

  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    
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
