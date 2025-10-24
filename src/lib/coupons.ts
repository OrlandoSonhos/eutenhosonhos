import { prismaWithRetry } from './prisma-utils'
import { prisma } from './prisma'
import { generateCouponCode, addDays } from './utils'
import { sendEmail, generateCouponEmailTemplate } from './email'
import { formatCurrency } from './utils'

export interface CreateCouponData {
  faceValueCents: number
  salePriceCents: number
  buyerId?: string
  expirationDays?: number
}

export async function createCoupon(data: CreateCouponData) {
  const code = generateCouponCode()
  const expiresAt = addDays(new Date(), data.expirationDays || 30)

  const coupon = await prismaWithRetry.coupon.create({
    data: {
      code,
      face_value_cents: data.faceValueCents,
      sale_price_cents: data.salePriceCents,
      buyer_id: data.buyerId,
      expires_at: expiresAt,
      status: 'AVAILABLE'
    },
    include: {
      buyer: true
    }
  }) as any

  // Enviar email se houver comprador
  if (coupon.buyer) {
    try {
      const emailHtml = generateCouponEmailTemplate(
        coupon.buyer.name,
        coupon.code,
        formatCurrency(coupon.face_value_cents),
        expiresAt.toLocaleDateString('pt-BR')
      )

      await sendEmail({
        to: coupon.buyer.email,
        subject: 'Seu cupom está pronto! - Eu tenho Sonhos',
        html: emailHtml
      })
    } catch (error) {
      console.error('Erro ao enviar email do cupom:', error)
    }
  }

  return coupon
}

export async function validateCoupon(code: string) {
  const coupon = await prismaWithRetry.coupon.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!coupon) {
    return { valid: false, error: 'Cupom não encontrado' }
  }

  if (coupon.status !== 'AVAILABLE') {
    return { valid: false, error: 'Cupom já foi utilizado ou expirou' }
  }

  if (new Date() > coupon.expires_at) {
    // Marcar como expirado
    await prismaWithRetry.coupon.update({
      where: { id: coupon.id },
      data: { status: 'EXPIRED' }
    })
    return { valid: false, error: 'Cupom expirado' }
  }

  return { valid: true, coupon }
}

export async function applyCoupon(code: string, orderId: string) {
  const validation = await validateCoupon(code)
  
  if (!validation.valid) {
    return validation
  }

  const { coupon } = validation

  // Marcar cupom como usado
  const updatedCoupon = await prismaWithRetry.coupon.update({
    where: { id: coupon!.id },
    data: {
      status: 'USED',
      used_at: new Date(),
      used_in_order_id: orderId
    }
  })

  return { valid: true, coupon: updatedCoupon, discount: coupon!.face_value_cents }
}

export async function getUserCoupons(userId: string) {
  // Buscar cupons antigos (valor fixo)
  const oldCoupons = await prismaWithRetry.coupon.findMany({
    where: {
      buyer_id: userId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // Buscar cupons percentuais comprados
  const percentualCoupons = await prisma.discountCouponPurchase.findMany({
    where: {
      user_id: userId,
    },
    include: {
      discount_coupon: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // Converter cupons percentuais para o formato unificado
  const convertedPercentualCoupons = percentualCoupons.map((couponPurchase) => ({
    id: couponPurchase.id,
    code: couponPurchase.code,
    buyer_id: couponPurchase.user_id,
    face_value_cents: 0, // Cupons percentuais não têm valor fixo
    sale_price_cents: 0,
    is_used: !!couponPurchase.used_at, // Se tem used_at, está usado
    expires_at: couponPurchase.expires_at,
    used_at: couponPurchase.used_at,
    created_at: couponPurchase.created_at,
    updated_at: new Date(), // DiscountCouponPurchase não tem updated_at
    order_id: null,
    payment_id: null,
    // Campos específicos para cupons percentuais
    discount_percent: couponPurchase.discount_coupon.discount_percent,
    isPercentual: true,
    name: `Cupom ${couponPurchase.discount_coupon.discount_percent}% de Desconto`,
    description: `Cupom com ${couponPurchase.discount_coupon.discount_percent}% de desconto`,
  }));

  // Combinar e ordenar todos os cupons
  const allCoupons = [
    ...oldCoupons.map(coupon => ({ ...coupon, isPercentual: false })),
    ...convertedPercentualCoupons,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allCoupons;
}

export async function getCouponStats() {
  const [total, available, used, expired] = await Promise.all([
    prismaWithRetry.coupon.count(),
    prismaWithRetry.coupon.count({ where: { status: 'AVAILABLE' } }),
    prismaWithRetry.coupon.count({ where: { status: 'USED' } }),
    prismaWithRetry.coupon.count({ where: { status: 'EXPIRED' } })
  ])

  const totalRevenue = await prismaWithRetry.coupon.aggregate({
    where: { status: 'USED' },
    _sum: { sale_price_cents: true }
  })

  return {
    total,
    available,
    used,
    expired,
    revenue: totalRevenue._sum?.sale_price_cents || 0
  }
}

export async function expireOldCoupons() {
  const expiredCoupons = await prismaWithRetry.coupon.updateMany({
    where: {
      status: 'AVAILABLE',
      expires_at: {
        lt: new Date()
      }
    },
    data: {
      status: 'EXPIRED'
    }
  })

  console.log(`${expiredCoupons.count} cupons expirados foram atualizados`)
  return expiredCoupons.count
}

// Tipos de cupons pré-definidos
export const COUPON_TYPES = [
  {
    id: 'cupom001',
    name: 'Cartão 0% de Desconto',
    faceValueCents: 1,
    salePriceCents: 1,
    description: 'Cartão de teste com 0% de desconto por apenas R$ 0,01'
  },
  {
    id: 'cupom25',
    name: 'Cartão 80% de Desconto',
    faceValueCents: 2500,
    salePriceCents: 500,
    description: 'Cartão com 80% de desconto - economize até R$ 25 por apenas R$ 5'
  },
  {
    id: 'cupom50',
    name: 'Cartão 80% de Desconto',
    faceValueCents: 5000,
    salePriceCents: 1000,
    description: 'Cartão com 80% de desconto - economize até R$ 50 por apenas R$ 10'
  },
  {
    id: 'cupom100',
    name: 'Cartão 80% de Desconto',
    faceValueCents: 10000,
    salePriceCents: 2000,
    description: 'Cartão com 80% de desconto - economize até R$ 100 por apenas R$ 20'
  },
  {
    id: 'cupom200',
    name: 'Cartão 80% de Desconto',
    faceValueCents: 20000,
    salePriceCents: 4000,
    description: 'Cartão com 80% de desconto - economize até R$ 200 por apenas R$ 40'
  }
]