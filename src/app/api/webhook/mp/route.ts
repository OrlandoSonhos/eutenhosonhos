import { NextRequest, NextResponse } from 'next/server'
import { getPayment, getMerchantOrder } from '@/lib/mercadopago'
import { createCoupon, COUPON_TYPES } from '@/lib/coupons'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail, sendCouponEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔔 WEBHOOK MP RECEBIDO:', new Date().toISOString(), body)
    
    // Log headers para debug
    const headers = Object.fromEntries(request.headers.entries())
    console.log('📋 Headers do webhook:', headers)

    // Verificar se é uma notificação de pagamento ou merchant order
    if (body.type === 'payment') {
      const paymentId = body.data?.id
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 })
      }
      
      // Processar pagamento diretamente
      await processPaymentWebhook(paymentId)
      return NextResponse.json({ status: 'processed' })
      
    } else if (body.type === 'merchant_order' || body.type === 'topic_merchant_order_wh') {
      const merchantOrderId = body.data?.id || body.id
      if (!merchantOrderId) {
        return NextResponse.json({ error: 'Merchant Order ID não encontrado' }, { status: 400 })
      }
      
      // Processar merchant order
      await processMerchantOrderWebhook(merchantOrderId)
      return NextResponse.json({ status: 'processed' })
      
    } else {
      console.log('🔕 Tipo de webhook ignorado:', body.type)
      return NextResponse.json({ status: 'ignored' })
    }



  } catch (error) {
    console.error('Erro no webhook MP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function processPaymentWebhook(paymentId: string) {
  console.log('🔍 Processando webhook de pagamento, ID:', paymentId)
  
  // Buscar detalhes do pagamento no Mercado Pago
  let paymentData
  
  // Verificar se é um pagamento de teste (para desenvolvimento)
  if (paymentId.startsWith('test_payment_')) {
    console.log('🧪 MODO TESTE - Simulando dados de pagamento')
    paymentData = {
      id: paymentId,
      status: 'approved',
      external_reference: 'coupon-' + Date.now(),
      transaction_amount: 0.01,
      payment_method_id: 'pix',
      payer: {
        email: 'vini_deiro@icloud.com',
        first_name: 'Vinicius'
      }
    }
  } else {
    try {
      paymentData = await getPayment(paymentId)
    } catch (error: any) {
      console.log('❌ Erro ao buscar pagamento no MP:', error)
      
      // Se o pagamento não foi encontrado, pode ser um webhook antigo ou inválido
      if (error?.status === 404 || error?.cause?.[0]?.code === 2000) {
        console.log('Pagamento não encontrado - ignorando webhook')
        return
      }
      
      // Para outros erros, relançar
      throw error
    }
  }
  
  if (!paymentData) {
    console.log('❌ Pagamento não encontrado no MP')
    return
  }

  console.log('💰 Dados do pagamento:', {
    id: paymentData.id,
    status: paymentData.status,
    external_reference: paymentData.external_reference,
    transaction_amount: paymentData.transaction_amount,
    payment_method_id: paymentData.payment_method_id
  })

  // Verificar se o pagamento foi aprovado
  if (paymentData.status !== 'approved') {
    console.log('Pagamento não aprovado, status:', paymentData.status)
    return
  }

  // Verificar se já processamos este pagamento
  const existingPayment = await prismaWithRetry.payment.findFirst({
    where: { mp_payment_id: paymentId.toString() }
  })

  if (existingPayment) {
    console.log('Pagamento já processado')
    return
  }

  await processPaymentData(paymentData)
}

async function processMerchantOrderWebhook(merchantOrderId: string) {
  console.log('🏪 Processando webhook de merchant order, ID:', merchantOrderId)
  
  try {
    // Buscar detalhes da merchant order no Mercado Pago
    const merchantOrder = await getMerchantOrder(merchantOrderId)
    
    console.log('🏪 Dados da merchant order:', {
      id: merchantOrder.id,
      status: merchantOrder.status,
      total_amount: merchantOrder.total_amount,
      payments: merchantOrder.payments?.length || 0
    })

    // Verificar se a ordem está fechada (paga)
    if (merchantOrder.status !== 'closed') {
      console.log('Merchant order não está fechada, status:', merchantOrder.status)
      return
    }

    // Processar cada pagamento da merchant order
    if (merchantOrder.payments && merchantOrder.payments.length > 0) {
      for (const payment of merchantOrder.payments) {
        console.log(`💳 Processando pagamento ${payment.id} da merchant order`)
        
        // Verificar se já processamos este pagamento
        const existingPayment = await prismaWithRetry.payment.findFirst({
          where: { mp_payment_id: String(payment.id) }
        })

        if (existingPayment) {
          console.log(`Pagamento ${payment.id} já processado`)
          continue
        }

        // Buscar detalhes completos do pagamento
        try {
          const paymentData = await getPayment(String(payment.id))
          
          if (paymentData.status === 'approved') {
            await processPaymentData(paymentData)
          } else {
            console.log(`Pagamento ${payment.id} não aprovado, status:`, paymentData.status)
          }
        } catch (error) {
          console.error(`Erro ao processar pagamento ${payment.id}:`, error)
        }
      }
    } else {
      console.log('❌ Merchant order sem pagamentos')
    }
    
  } catch (error) {
    console.error('Erro ao processar merchant order:', error)
    throw error
  }
}

async function processPaymentData(paymentData: any) {
  const externalReference = paymentData.external_reference
  
  console.log('🔍 DECISÃO DE PROCESSAMENTO:')
  console.log('   external_reference:', externalReference)
  console.log('   É cupom?', externalReference?.startsWith('coupon-'))
  console.log('   É pedido?', externalReference?.startsWith('order-'))
  
  // Processar pagamento de cupom
  if (externalReference?.startsWith('coupon-')) {
    console.log('🎫 PROCESSANDO COMO CUPOM...')
    await processCouponPayment(paymentData)
  }
  // Processar pagamento de pedido
  else if (externalReference?.startsWith('order-')) {
    console.log('📦 PROCESSANDO COMO PEDIDO...')
    await processOrderPayment(paymentData)
  }
  else {
    console.log('❌ EXTERNAL_REFERENCE INVÁLIDO OU AUSENTE!')
    console.log('   Valor recebido:', externalReference)
    
    // Para merchant orders sem external_reference, tentar processar como cupom
    // baseado no valor pago
    console.log('🔄 Tentando processar como cupom baseado no valor...')
    await processCouponPayment(paymentData)
  }
}

async function processCouponPayment(paymentData: any) {
  try {
    console.log('🎫 INICIANDO PROCESSAMENTO DE CUPOM')
    console.log('   Payment ID:', paymentData.id)
    console.log('   Valor bruto:', paymentData.transaction_amount)
    
    // Determinar tipo de cupom baseado no valor pago
    const paidAmount = Math.round(paymentData.transaction_amount * 100) // Converter para centavos
    console.log('   Valor em centavos:', paidAmount)
    
    console.log('   Tipos de cupom disponíveis:')
    COUPON_TYPES.forEach(type => {
      console.log(`     ${type.id}: R$ ${type.faceValueCents/100} por R$ ${type.salePriceCents/100}`)
    })
    
    const couponType = COUPON_TYPES.find(type => type.salePriceCents === paidAmount)
    
    if (!couponType) {
      console.error('❌ Tipo de cupom não encontrado para valor:', paidAmount)
      console.error('   Valores disponíveis:', COUPON_TYPES.map(t => t.salePriceCents))
      return
    }
    
    console.log('✅ Tipo de cupom encontrado:', couponType.id)

    // Buscar APENAS usuário logado (sessão ativa)
    let userId = null
    let userEmail = null
    let userName = 'Cliente'

    console.log('🔍 Buscando usuário logado (sessão ativa)...')
    const activeSession = await prisma.session.findFirst({
      where: {
        expires: {
          gt: new Date()
        }
      },
      orderBy: {
        expires: 'desc'
      },
      include: {
        user: true
      }
    })

    if (activeSession?.user) {
      userId = activeSession.user.id
      userEmail = activeSession.user.email
      userName = activeSession.user.name || 'Cliente'
      console.log('✅ Usuário logado encontrado:', userEmail)
    } else {
      console.log('❌ Nenhum usuário logado encontrado')
      console.log('   O cupom será criado mas não será enviado por e-mail')
      console.log('   Para receber cupons por e-mail, o usuário deve estar logado')
    }

    console.log('👤 Usuário final:', { userId, userEmail, userName })

    // Criar cupom
    const coupon = await createCoupon({
      faceValueCents: couponType.faceValueCents,
      salePriceCents: couponType.salePriceCents,
      buyerId: userId || undefined,
      expirationDays: 30
    })

    // Registrar pagamento
    await prismaWithRetry.payment.create({
      data: {
        coupon_id: coupon.id,
        mp_payment_id: paymentData.id.toString(),
        amount_cents: paidAmount,
        status: 'APPROVED',
        method: getPaymentMethod(paymentData.payment_method_id)
      }
    })

    console.log('Cupom criado com sucesso:', coupon.code)

    // Enviar email com o cupom se houver email do usuário
    if (userEmail) {
      try {
        console.log('📧 Tentando enviar e-mail do cupom...')
        console.log('   Para:', userEmail)
        console.log('   Código:', coupon.code)
        console.log('   Valor:', coupon.faceValueCents)
        console.log('   Nome:', userName)
        console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA')
        console.log('   SMTP_USER:', process.env.SMTP_USER)
        console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '***configurada***' : 'NÃO CONFIGURADA')
        
        await sendCouponEmail({
          to: userEmail,
          couponCode: coupon.code,
          couponValue: coupon.faceValueCents,
          customerName: userName
        })
        
        console.log('✅ E-mail do cupom enviado com sucesso!')
      } catch (emailError) {
        console.error('❌ Erro ao enviar email do cupom:', emailError)
        console.error('   Tipo do erro:', typeof emailError)
        
        // Type checking para acessar propriedades do erro
        if (emailError && typeof emailError === 'object') {
          const error = emailError as any
          if ('code' in error) {
            console.error('   Código:', error.code)
          }
          if ('message' in error) {
            console.error('   Mensagem:', error.message)
          }
          if ('response' in error) {
            console.error('   Response:', error.response)
          }
        }
        // Não falhar o processamento se o email falhar
      }
    } else {
      console.log('⚠️ Nenhum usuário logado encontrado - cupom criado mas e-mail não enviado')
      console.log('   💡 Para receber cupons por e-mail automaticamente, faça login antes do pagamento')
      console.log('   📋 O cupom pode ser acessado em /meus-cupons após fazer login')
    }

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
    const order = await prismaWithRetry.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        order_items: {
          include: { product: true }
        }
      }
    }) as any

    if (!order) {
      console.error('Pedido não encontrado:', orderId)
      return
    }

    // Atualizar status do pedido
    await prismaWithRetry.order.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    })

    // Registrar pagamento
    await prismaWithRetry.payment.create({
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
        console.error('❌ Erro ao enviar e-mail de confirmação:', emailError)
        console.error('   Tipo do erro:', typeof emailError)
        
        // Type checking para acessar propriedades do erro
        if (emailError && typeof emailError === 'object') {
          const error = emailError as any
          if ('code' in error) {
            console.error('   Código:', error.code)
          }
          if ('message' in error) {
            console.error('   Mensagem:', error.message)
          }
          if ('response' in error) {
            console.error('   Response:', error.response)
          }
        }
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
