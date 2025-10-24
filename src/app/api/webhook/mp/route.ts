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
      external_reference: 'coupon-' + Date.now() + '-user-cmgl6yb980000l404zqlm7rfr',
      transaction_amount: 10.00,
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
    
    // Buscar cupom de desconto baseado no valor pago (mapeamento dinâmico)
    const discountCoupon = await prisma.discountCoupon.findFirst({
      where: {
        sale_price_cents: paidAmount,
        is_active: true
      }
    })
    
    if (!discountCoupon) {
      console.error('❌ Cupom de desconto não encontrado para valor:', paidAmount)
      console.error(`   Valor pago: R$ ${(paidAmount / 100).toFixed(2)}`)
      
      // Listar cupons disponíveis para debug
      const availableCoupons = await prisma.discountCoupon.findMany({
        where: { is_active: true },
        select: { type: true, discount_percent: true, sale_price_cents: true }
      })
      
      console.error('   Cupons disponíveis:')
      availableCoupons.forEach(coupon => {
        const price = coupon.sale_price_cents ? (coupon.sale_price_cents / 100).toFixed(2) : 'N/A'
        console.error(`     - ${coupon.type}: ${coupon.discount_percent}% por R$ ${price}`)
      })
      
      return
    }
    
    console.log('✅ Cupom de desconto encontrado:', discountCoupon.type, `${discountCoupon.discount_percent}%`)

    // Extrair ID do usuário do external_reference
    let userId = null
    let userEmail = null
    let userName = 'Cliente'

    console.log('🔍 Extraindo ID do usuário do external_reference...')
    const externalReference = paymentData.external_reference
    console.log('   external_reference:', externalReference)
    
    // Formato esperado: coupon-1234567890-user-userId
    const userIdMatch = externalReference?.match(/-user-(.+)$/)
    if (userIdMatch) {
      const extractedUserId = userIdMatch[1]
      console.log('✅ ID do usuário extraído:', extractedUserId)
      
      // Buscar dados do usuário
      const user = await prisma.user.findUnique({
        where: { id: extractedUserId }
      })
      
      if (user) {
        userId = user.id
        userEmail = user.email
        userName = user.name || 'Cliente'
        console.log('✅ Usuário encontrado:', userEmail)
      } else {
        console.log('❌ Usuário não encontrado no banco de dados')
      }
    } else {
      console.log('❌ ID do usuário não encontrado no external_reference')
      console.log('   O cupom será criado mas não será enviado por e-mail')
      console.log('   Para receber cupons por e-mail, faça login antes da compra')
    }

    console.log('👤 Usuário final:', { userId, userEmail, userName })

    // Gerar código único para o cupom
    const generateCouponCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let couponCode = generateCouponCode()
    
    // Verificar se o código já existe
    let existingCoupon = await prisma.discountCouponPurchase.findFirst({
      where: { code: couponCode }
    })
    
    while (existingCoupon) {
      couponCode = generateCouponCode()
      existingCoupon = await prisma.discountCouponPurchase.findFirst({
        where: { code: couponCode }
      })
    }

    // Verificar se temos um userId válido antes de criar o cupom
    if (!userId) {
      console.error('❌ Não é possível criar cupom sem userId válido')
      console.error('   O pagamento foi processado mas o cupom não foi criado')
      return
    }

    // Criar compra do cupom de desconto
    const couponPurchase = await prisma.discountCouponPurchase.create({
      data: {
        code: couponCode,
        discount_coupon_id: discountCoupon.id,
        buyer_id: userId,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano de validade
      }
    })

    console.log('Cupom de desconto criado com sucesso:', couponCode)

    // Registrar pagamento (opcional - pode criar uma tabela específica para pagamentos de cupons de desconto)
    // Por enquanto, vamos apenas logar o pagamento
    console.log('💰 Pagamento registrado:', {
      mp_payment_id: paymentData.id.toString(),
      amount_cents: paidAmount,
      status: 'APPROVED',
      method: getPaymentMethod(paymentData.payment_method_id),
      coupon_code: couponCode
    })

    // Enviar email com o cupom se houver email do usuário
    if (userEmail) {
      try {
        console.log('📧 Tentando enviar e-mail do cupom...')
        console.log('   Para:', userEmail)
        console.log('   Código:', couponCode)
        console.log('   Desconto:', `${discountCoupon.discount_percent}%`)
        console.log('   Nome:', userName)
        console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA')
        console.log('   SMTP_USER:', process.env.SMTP_USER)
        console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '***configurada***' : 'NÃO CONFIGURADA')
        
        // Enviar email personalizado para cupom de desconto percentual
        await sendCouponEmail({
          to: userEmail,
          couponCode: couponCode,
          couponValue: 0, // Não é valor fixo, é percentual
          customerName: userName,
          discountPercent: discountCoupon.discount_percent
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
