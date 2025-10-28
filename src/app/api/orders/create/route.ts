import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { validateCoupon, applyCoupon } from '@/lib/coupons'
import { validateDiscountCoupon } from '@/lib/discount-coupons'
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
  discountCouponCode: z.string().optional(),
  selectedProductForCoupon: z.string().optional(),
  subtotal: z.number(),
  shipping: z.number(),
  discount: z.number(),
  total: z.number(),
  shippingAddress: z.object({
    cep: z.string(),
    address: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    district: z.string(),
    city: z.string(),
    state: z.string()
  }).optional(),
  selectedShipping: z.object({
    service: z.string(),
    price_cents: z.number(),
    delivery_time: z.string()
  }).optional()
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

    // Debug: verificar se o user.id existe
    console.log('Session:', JSON.stringify(session, null, 2))
    const userId = (session as any).user?.id
    
    if (!userId) {
      console.error('User ID não encontrado na sessão:', session)
      return NextResponse.json(
        { error: 'ID do usuário não encontrado na sessão' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe no banco
    const userExists = await prismaWithRetry.user.findUnique({
      where: { id: userId }
    })

    if (!userExists) {
      console.error('Usuário não encontrado no banco:', userId)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const orderData = createOrderSchema.parse(body)

    // Verificar se todos os produtos existem e têm estoque suficiente
    for (const item of orderData.items) {
      const product = await prismaWithRetry.product.findUnique({
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

    // Validar cupom de desconto se fornecido
    let discountCoupon = null
    if (orderData.discountCouponCode) {
      const discountCouponValidation = await validateDiscountCoupon({
        code: orderData.discountCouponCode,
        total_cents: orderData.subtotal,
        cart_items: orderData.items,
        selected_product_id: orderData.selectedProductForCoupon!,
        user_id: userId
      })

      if (!discountCouponValidation.valid) {
        return NextResponse.json(
          { error: discountCouponValidation.error },
          { status: 400 }
        )
      }

      discountCoupon = discountCouponValidation
    }

    // Calcular o valor final (inicialmente igual ao total, será atualizado se houver cupom)
    let finalCents = orderData.total
    let discountCents = 0

    // Se há cupom de valor, aplicar o desconto
    if (coupon) {
      // Para cupons de valor, o desconto é o valor facial do cupom
      discountCents = coupon.face_value_cents
      finalCents = Math.max(0, orderData.total - discountCents)
    } else if (orderData.discount > 0) {
      // Se não há cupom regular mas há desconto calculado no frontend, usar esse desconto
      discountCents = orderData.discount
      finalCents = Math.max(0, orderData.total)
    }

    // Criar o pedido no banco de dados
    const order = await prismaWithRetry.order.create({
      data: {
        user_id: userId,
        status: 'PENDING',
        total_cents: orderData.total,
        discount_cents: discountCents,
        final_cents: finalCents,
        shipping_cents: orderData.shipping,
        shipping_cep: orderData.shippingAddress?.cep,
        shipping_address: orderData.shippingAddress?.address,
        shipping_number: orderData.shippingAddress?.number,
        shipping_complement: orderData.shippingAddress?.complement,
        shipping_district: orderData.shippingAddress?.district,
        shipping_city: orderData.shippingAddress?.city,
        shipping_state: orderData.shippingAddress?.state,
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

    // Aplicar cupom se fornecido
    if (coupon) {
      await applyCoupon(coupon.code, order.id)
    }

    // Aplicar cupom de desconto se fornecido
    let finalDiscountCents = 0
    console.log('🎫 Cupom recebido:', orderData.discountCouponCode);
    console.log('💰 Valores recebidos do frontend:', { subtotal: orderData.subtotal, shipping: orderData.shipping, discount: orderData.discount, total: orderData.total });
    
    if (discountCoupon && orderData.discountCouponCode) {
      try {
        // Aplicar cupom de desconto diretamente (função interna)
        const discountResult = await applyDiscountCouponInternal(orderData.discountCouponCode, order.id, userId)
        if (discountResult.success) {
          finalDiscountCents = discountResult.discount_cents || 0
          console.log('✅ Cupom de desconto aplicado - desconto:', finalDiscountCents);
        } else {
          console.error('Erro ao aplicar cupom de desconto:', discountResult.error)
        }
      } catch (error) {
        console.error('Erro ao aplicar cupom de desconto:', error)
      }
    }

    // Calcular o desconto total (cupons de valor + cupons de desconto)
    const totalDiscountCents = discountCents + finalDiscountCents
    console.log('🧮 Cálculo de desconto:', {
      discountCents,
      finalDiscountCents,
      totalDiscountCents
    });

    // Calcular itens com desconto aplicado para o Mercado Pago
    const itemsForMP = orderData.items.map(item => {
      // Calcular proporção do desconto total para este item
      const itemTotal = item.price_cents * item.quantity
      const subtotalCents = orderData.items.reduce((sum, i) => sum + (i.price_cents * i.quantity), 0)
      const itemDiscountProportion = subtotalCents > 0 ? itemTotal / subtotalCents : 0
      const itemDiscount = Math.round(totalDiscountCents * itemDiscountProportion)
      const finalItemPrice = Math.max(1, item.price_cents - Math.round(itemDiscount / item.quantity)) // Mínimo de 1 centavo

      console.log(`📦 Item ${item.id}:`, {
        originalPrice: item.price_cents,
        itemDiscountProportion,
        itemDiscount,
        finalItemPrice
      });

      return {
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price_cents: finalItemPrice
      }
    })

    // Criar preferência no Mercado Pago com valores já com desconto aplicado
    console.log('🚀 Enviando para Mercado Pago:', {
      items: itemsForMP,
      shippingCents: orderData.selectedShipping?.price_cents || orderData.shipping,
      totalValue: itemsForMP.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0) + (orderData.selectedShipping?.price_cents || orderData.shipping)
    });
    
    const preference = await createOrderPreference(
      itemsForMP,
      (session as any).user.email,
      order.id,
      orderData.selectedShipping?.price_cents || orderData.shipping,
      orderData.selectedShipping?.service || 'Entrega'
    )

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

// Função interna para aplicar cupom de desconto
async function applyDiscountCouponInternal(code: string, orderId: string, userId: string) {
  try {
    // Verificar se o pedido existe e pertence ao usuário
    const order = await prismaWithRetry.order.findFirst({
      where: {
        id: orderId,
        user_id: userId,
        status: 'PENDING'
      }
    })

    if (!order) {
      return { success: false, error: 'Pedido não encontrado ou não pode ser modificado' }
    }

    // Verificar se já existe um desconto aplicado neste pedido
    if (order.discount_cents > 0) {
      return { success: false, error: 'Já existe um cartão aplicado neste pedido' }
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
      return { success: false, error: 'Cartão não encontrado ou já foi usado' }
    }

    // Verificar se o cupom está disponível
    if (coupon.status !== 'AVAILABLE') {
      return { success: false, error: 'Cartão não está disponível' }
    }

    // Verificar se o cupom expirou
    const now = new Date()
    if (coupon.expires_at && now > coupon.expires_at) {
      return { success: false, error: 'Cartão expirado' }
    }

    // Calcular desconto baseado no valor do cupom
    const discount_amount = coupon.face_value_cents
    const new_total = Math.max(0, order.total_cents - discount_amount)

    // Aplicar o cupom em uma transação
    await prismaWithRetry.$transaction(async (tx) => {
      // Marcar o cupom como usado
      await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          status: 'USED',
          used_at: new Date(),
          used_in_order_id: orderId,
          updated_at: new Date()
        }
      })

      // Atualizar o total do pedido
      await tx.order.update({
        where: { id: orderId },
        data: {
          total_cents: new_total,
          discount_cents: discount_amount
        }
      })
    })

    return {
      success: true,
      discount_cents: discount_amount,
      new_total,
      savings: discount_amount
    }

  } catch (error) {
    console.error('Erro ao aplicar cupom de desconto:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}
