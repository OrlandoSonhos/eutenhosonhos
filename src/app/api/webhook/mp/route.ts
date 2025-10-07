import { NextRequest, NextResponse } from 'next/server'
import { getPayment } from '@/lib/mercadopago'
import { createCoupon, COUPON_TYPES } from '@/lib/coupons'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook MP recebido:', body)

    // Verificar se é uma notificação de pagamento
    if (body.type !== 'payment') {
      return NextResponse.json({ status: 'ignored' })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 })
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const paymentData = await getPayment(paymentId)
    
    if (!paymentData) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    console.log('Dados do pagamento:', paymentData)

    // Verificar se o pagamento foi aprovado
    if (paymentData.status !== 'approved') {
      console.log('Pagamento não aprovado, status:', paymentData.status)
      return NextResponse.json({ status: 'payment_not_approved' })
    }

    // Verificar se já processamos este pagamento
    const existingPayment = await prisma.payment.findFirst({
      where: { mp_payment_id: paymentId.toString() }
    })

    if (existingPayment) {
      console.log('Pagamento já processado')
      return NextResponse.json({ status: 'already_processed' })
    }

    const externalReference = paymentData.external_reference
    
    // Processar pagamento de cupom
    if (externalReference?.startsWith('coupon-')) {
      await processCouponPayment(paymentData)
    }
    // Processar pagamento de pedido
    else if (externalReference?.startsWith('order-')) {
      await processOrderPayment(paymentData)
    }

    return NextResponse.json({ status: 'processed' })

  } catch (error) {
    console.error('Erro no webhook MP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function processCouponPayment(paymentData: any) {
  try {
    // Determinar tipo de cupom baseado no valor pago
    const paidAmount = Math.round(paymentData.transaction_amount * 100) // Converter para centavos
    
    const couponType = COUPON_TYPES.find(type => type.salePriceCents === paidAmount)
    
    if (!couponType) {
      console.error('Tipo de cupom não encontrado para valor:', paidAmount)
      return
    }

    // Buscar usuário pelo email do pagador
    let userId = null
    if (paymentData.payer?.email) {
      const user = await prisma.user.findUnique({
        where: { email: paymentData.payer.email }
      })
      userId = user?.id
    }

    // Criar cupom
    const coupon = await createCoupon({
      faceValueCents: couponType.faceValueCents,
      salePriceCents: couponType.salePriceCents,
      buyerId: userId || undefined,
      expirationDays: 30
    })

    // Registrar pagamento
    await prisma.payment.create({
      data: {
        coupon_id: coupon.id,
        mp_payment_id: paymentData.id.toString(),
        amount_cents: paidAmount,
        status: 'APPROVED',
        method: getPaymentMethod(paymentData.payment_method_id)
      }
    })

    console.log('Cupom criado com sucesso:', coupon.code)

  } catch (error) {
    console.error('Erro ao processar pagamento de cupom:', error)
    throw error
  }
}

async function processOrderPayment(paymentData: any) {
  try {
    const externalReference = paymentData.external_reference
    const orderId = externalReference.replace('order-', '')

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        order_items: {
          include: { product: true }
        }
      }
    })

    if (!order) {
      console.error('Pedido não encontrado:', orderId)
      return
    }

    // Atualizar status do pedido
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    })

    // Registrar pagamento
    await prisma.payment.create({
      data: {
        order_id: orderId,
        mp_payment_id: paymentData.id.toString(),
        amount_cents: Math.round(paymentData.transaction_amount * 100),
        status: 'APPROVED',
        method: getPaymentMethod(paymentData.payment_method_id)
      }
    })

    // Enviar e-mail de confirmação
    if (order.user?.email) {
      try {
        const items = order.order_items.map((item: typeof order.order_items[0]) => ({
          name: item.product.title,
          quantity: item.quantity,
          priceCents: item.price_cents
        }))

        await sendOrderConfirmationEmail({
          to: order.user.email,
          orderId: order.id,
          customerName: order.user.name,
          totalCents: order.total_cents,
          items
        })

        console.log('E-mail de confirmação enviado para:', order.user.email)
      } catch (emailError) {
        console.error('Erro ao enviar e-mail de confirmação:', emailError)
        // Não falhar o webhook por causa do e-mail
      }
    }

    console.log('Pedido pago com sucesso:', orderId)

  } catch (error) {
    console.error('Erro ao processar pagamento de pedido:', error)
    throw error
  }
}

function getPaymentMethod(methodId: string): 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' {
  if (methodId === 'pix') return 'PIX'
  if (methodId?.includes('credit')) return 'CREDIT_CARD'
  return 'DEBIT_CARD'
}

// Permitir GET para teste
export async function GET() {
  return NextResponse.json({ message: 'Webhook MP ativo' })
}
