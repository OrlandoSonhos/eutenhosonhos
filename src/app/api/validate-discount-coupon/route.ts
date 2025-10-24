import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código do cartão é obrigatório'),
  total_cents: z.number().min(1, 'Total do pedido deve ser maior que zero')
})

// POST - Validar cupom de desconto
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
    const { code, total_cents } = validateCouponSchema.parse(body)
    const userId = (session as any).user.id

    // Buscar cupons comprados pelo usuário - Fix: Garantir tipagem correta
    const couponPurchases = await prismaWithRetry.discountCouponPurchase.findMany({
      where: { 
        buyer_id: userId,
        code: code.toUpperCase(),
        used_at: null // Cupom não usado
      },
      include: {
        discount_coupon: true
      }
    }) as Array<{
      id: string;
      buyer_id: string;
      discount_coupon_id: string;
      order_id: string | null;
      code: string;
      expires_at: Date | null;
      used_at: Date | null;
      created_at: Date;
      discount_coupon: {
        id: string;
        type: string;
        discount_percent: number;
        is_active: boolean;
        sale_price_cents: number;
        created_at: Date;
        valid_from: Date | null;
        valid_until: Date | null;
      };
    }>

    if (couponPurchases.length === 0) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão não encontrado ou já utilizado' 
        },
        { status: 400 }
      )
    }

    const couponPurchase = couponPurchases[0]
    const coupon = couponPurchase.discount_coupon

    // Verificar se o cupom está ativo
    if (!coupon.is_active) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão inativo' 
        },
        { status: 400 }
      )
    }

    // Verificar se o cupom comprado expirou
    if (couponPurchase.expires_at && new Date() > couponPurchase.expires_at) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão expirado' 
        },
        { status: 400 }
      )
    }

    // Verificar datas de validade
    const now = new Date()
    
    if (coupon.valid_from && now < coupon.valid_from) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão ainda não está válido' 
        },
        { status: 400 }
      )
    }

    if (coupon.valid_until && now > coupon.valid_until) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão expirado' 
        },
        { status: 400 }
      )
    }

    // Calcular desconto
    const discount_amount = Math.floor((total_cents * coupon.discount_percent) / 100)
    const final_total = total_cents - discount_amount

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: couponPurchase.code,
        discount_percent: coupon.discount_percent,
        type: coupon.type
      },
      discount_amount,
      final_total,
      savings: discount_amount
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Dados inválidos', 
          details: error.issues
        },
        { status: 400 }
      )
    }

    console.error('Erro ao validar cupom:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}