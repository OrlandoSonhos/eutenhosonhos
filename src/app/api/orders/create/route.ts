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

    // Calcular totais base (subtotal + frete) sem considerar desconto do frontend
    const subtotalCents = orderData.items.reduce((sum, i) => sum + (i.price_cents * i.quantity), 0)
    const shippingCents = orderData.selectedShipping?.price_cents || orderData.shipping
    const baseTotalCents = subtotalCents + shippingCents

    // Inicialmente, aplicar apenas cupons de valor (não porcentagem) no servidor
    let discountCents = 0
    let finalCents = baseTotalCents

    if (coupon) {
      // Para cupons de valor, o desconto é o valor facial do cupom
      discountCents = coupon.face_value_cents
      finalCents = Math.max(0, baseTotalCents - discountCents)
    }

    // Criar o pedido no banco de dados
    const order = await prismaWithRetry.order.create({
      data: {
        user_id: userId,
        status: 'PENDING',
        // total_cents sempre representa subtotal + frete, sem descontos
        total_cents: baseTotalCents,
        discount_cents: discountCents,
        final_cents: finalCents,
        shipping_cents: shippingCents,
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
    
    if (discountCoupon && orderData.discountCouponCode && orderData.selectedProductForCoupon) {
      try {
        // Aplicar cupom de desconto diretamente (função interna)
        const discountResult = await applyDiscountCouponInternal(orderData.discountCouponCode, order.id, userId, orderData.selectedProductForCoupon)
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
      const subtotalForDistribution = orderData.items.reduce((sum, i) => sum + (i.price_cents * i.quantity), 0)
      const itemDiscountProportion = subtotalForDistribution > 0 ? itemTotal / subtotalForDistribution : 0
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
      shippingCents: shippingCents,
      totalValue: itemsForMP.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0) + shippingCents
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
async function applyDiscountCouponInternal(code: string, orderId: string, userId: string, selectedProductId: string) {
  try {
    // Verificar se o pedido existe e pertence ao usuário
    const order = await prismaWithRetry.order.findFirst({
      where: {
        id: orderId,
        user_id: userId,
        status: 'PENDING'
      },
      include: {
        order_items: {
          include: {
            product: true
          }
        }
      }
    }) as any

    if (!order) {
      return { success: false, error: 'Pedido não encontrado ou não pode ser modificado' }
    }

    // Verificar se já existe um cupom de desconto aplicado neste pedido
    // (permitir cupons de valor + cupons de desconto, mas não múltiplos cupons de desconto)
    const existingDiscountCoupon = await prismaWithRetry.discountCouponPurchase.findFirst({
      where: {
        order_id: orderId,
        used_at: { not: null }
      }
    })
    
    if (existingDiscountCoupon) {
      return { success: false, error: 'Já existe um cupom de desconto aplicado neste pedido' }
    }

    // Buscar cupom de desconto comprado pelo usuário
    const couponPurchase = await prismaWithRetry.discountCouponPurchase.findFirst({
      where: { 
        buyer_id: userId,
        code: code.toUpperCase()
      },
      include: {
        discount_coupon: true
      }
    }) as any

    if (!couponPurchase) {
      return { success: false, error: 'Cartão não encontrado' }
    }

    // Verificar se o cupom já foi usado (uso único)
    if (couponPurchase.used_at) {
      return { success: false, error: 'Este cartão já foi utilizado e só pode ser usado uma vez' }
    }

    const coupon = couponPurchase.discount_coupon

    // Verificar se o cupom está ativo
    if (!coupon.is_active) {
      return { success: false, error: 'Cartão inativo' }
    }

    // Verificar se o cupom comprado expirou
    if (couponPurchase.expires_at && new Date() > couponPurchase.expires_at) {
      return { success: false, error: 'Cartão expirado' }
    }

    // Verificar datas de validade do cupom
    const now = new Date()
    
    if (coupon.valid_from && now < coupon.valid_from) {
      return { success: false, error: 'Cartão ainda não está válido. Verifique a data de início.' }
    }

    if (coupon.valid_until && now > coupon.valid_until) {
      return { success: false, error: 'Cartão expirado. Período de validade encerrado.' }
    }

    // Encontrar o produto selecionado no pedido
    const selectedOrderItem = order.order_items.find((item: any) => item.product_id === selectedProductId)
    if (!selectedOrderItem) {
      return { success: false, error: 'Produto selecionado não encontrado no pedido' }
    }

    // Calcular desconto baseado na porcentagem
    const productPrice = selectedOrderItem.price_cents * selectedOrderItem.quantity
    const discountAmount = Math.floor(productPrice * (coupon.discount_percent / 100))
    
    // O discount_cents pode já conter desconto de cupom de valor
    // Vamos adicionar o desconto do cupom de desconto ao existente
    const existingDiscount = order.discount_cents || 0
    const newTotalDiscount = existingDiscount + discountAmount
    const newFinal = Math.max(0, order.total_cents - newTotalDiscount)

    // Aplicar o cupom em uma transação
    await prismaWithRetry.$transaction(async (tx) => {
      // Marcar o cupom como usado
      await tx.discountCouponPurchase.update({
        where: { id: couponPurchase.id },
        data: {
          used_at: new Date(),
          order_id: orderId
        }
      })

      // Atualizar totais do pedido (mantendo total_cents como base e ajustando final_cents)
      await tx.order.update({
        where: { id: orderId },
        data: {
          discount_cents: newTotalDiscount,
          final_cents: newFinal
        }
      })
    })

    return {
      success: true,
      discount_cents: discountAmount,
      new_total: newFinal,
      savings: discountAmount
    }

  } catch (error) {
    console.error('Erro ao aplicar cupom de desconto:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}
