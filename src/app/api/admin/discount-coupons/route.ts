import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const createDiscountCouponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  type: z.enum(['REGULAR_25', 'AUCTION_50']),
  discount_percent: z.number().min(1).max(100),
  is_active: z.boolean().default(true),
  requires_auction: z.boolean().default(false),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  max_uses: z.number().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const coupons = await prismaWithRetry.coupon.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          order_discounts: {
            include: {
              order: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Erro ao buscar cupons de desconto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createDiscountCouponSchema.parse(body)

    // Verificar se o código já existe
    const existingCoupon = await prismaWithRetry.coupon.findUnique({
      where: { code: validatedData.code }
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Código de cupom já existe' },
        { status: 400 }
      )
    }

    const coupon = await prismaWithRetry.coupon.create({
      data: {
        code: validatedData.code,
        type: validatedData.type as any,
        discount_percent: validatedData.discount_percent,
        is_active: validatedData.is_active,
        requires_auction: validatedData.requires_auction,
        valid_from: validatedData.valid_from ? new Date(validatedData.valid_from) : null,
        valid_until: validatedData.valid_until ? new Date(validatedData.valid_until) : null,
        max_uses: validatedData.max_uses,
      }
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar cupom de desconto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}