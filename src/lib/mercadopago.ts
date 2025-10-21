import { MercadoPagoConfig, Preference, Payment, MerchantOrder } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
})

const preference = new Preference(client)
const payment = new Payment(client)
const merchantOrder = new MerchantOrder(client)

export interface CreatePreferenceData {
  items: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    description?: string
  }>
  payer?: {
    name?: string
    email?: string
  }
  external_reference?: string
  notification_url?: string
  back_urls?: {
    success?: string
    failure?: string
    pending?: string
  }
}

export async function createPreference(data: CreatePreferenceData) {
  try {
    const preferenceData = {
      items: data.items,
      payer: data.payer,
      external_reference: data.external_reference,
      notification_url: data.notification_url,
      back_urls: data.back_urls,
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      }
    }

    const response = await preference.create({ body: preferenceData })
    return response
  } catch (error) {
    console.error('Erro ao criar preferência no Mercado Pago:', error)
    throw error
  }
}

export async function getPayment(paymentId: string) {
  try {
    const response = await payment.get({ id: paymentId })
    return response
  } catch (error) {
    console.error('Erro ao buscar pagamento no Mercado Pago:', error)
    throw error
  }
}

export async function getMerchantOrder(merchantOrderId: string) {
  try {
    const response = await merchantOrder.get({ merchantOrderId })
    return response
  } catch (error) {
    console.error('Erro ao buscar merchant order no Mercado Pago:', error)
    throw error
  }
}

export function createCouponPreference(
  faceValue: number,
  salePrice: number,
  couponType: string,
  userEmail?: string
) {
  return createPreference({
    items: [
      {
        id: `coupon-${couponType}`,
        title: `Cupom de Desconto - ${formatCurrency(faceValue)}`,
        quantity: 1,
        unit_price: salePrice / 100, // Mercado Pago usa valores em reais
        description: `Cupom de desconto no valor de ${formatCurrency(faceValue)}`
      }
    ],
    payer: userEmail ? { email: userEmail } : undefined,
    external_reference: `coupon-${Date.now()}`,
    notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhook/mp`,
    back_urls: {
      success: `${process.env.APP_URL || 'http://localhost:3000'}/cupons/sucesso`,
      failure: `${process.env.APP_URL || 'http://localhost:3000'}/cupons/erro`,
      pending: `${process.env.APP_URL || 'http://localhost:3000'}/cupons/pendente`
    }
  })
}

export function createOrderPreference(
  items: Array<{
    id: string
    title: string
    quantity: number
    price_cents: number
  }>,
  userEmail?: string,
  orderId?: string,
  shippingCents?: number,
  shippingService?: string
) {
  const mpItems = items.map(item => ({
    id: item.id,
    title: item.title,
    quantity: item.quantity,
    unit_price: item.price_cents / 100, // Converter centavos para reais
    description: item.title
  }))

  // Adicionar frete como item separado se houver
  if (shippingCents && shippingCents > 0) {
    mpItems.push({
      id: 'shipping',
      title: `Frete - ${shippingService || 'Entrega'}`,
      quantity: 1,
      unit_price: shippingCents / 100, // Converter centavos para reais
      description: `Taxa de entrega - ${shippingService || 'Entrega'}`
    })
  }

  return createPreference({
    items: mpItems,
    payer: userEmail ? { email: userEmail } : undefined,
    external_reference: orderId || `order-${Date.now()}`,
    notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhook/mp`,
    back_urls: {
      success: `${process.env.APP_URL || 'http://localhost:3000'}/pedidos/sucesso`,
      failure: `${process.env.APP_URL || 'http://localhost:3000'}/pedidos/erro`,
      pending: `${process.env.APP_URL || 'http://localhost:3000'}/pedidos/pendente`
    }
  })
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}