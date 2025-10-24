import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const createDiscountCouponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').max(20, 'Código deve ter no máximo 20 caracteres'),
  discount_percent: z.number().min(1).max(100, 'Desconto deve estar entre 1% e 100%'),
  type: z.enum(['PERMANENT_25', 'SPECIAL_50']),
  sale_price_cents: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  max_uses: z.number().min(1).optional()
})

// GET - Listar cupons de desconto (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const active = searchParams.get('active')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        code: { contains: search, mode: 'insensitive' as const }
      }),
      ...(active !== null && active !== undefined && { is_active: active === 'true' }),
      ...(type && { type: type as any })
    }

    const [coupons, total] = await Promise.all([
      prismaWithRetry.discountCoupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { purchases: true }
          }
        }
      }),
      prismaWithRetry.discountCoupon.count({ where })
    ])

    return NextResponse.json({
      coupons: (coupons as any[]).map((coupon: any) => ({
        ...coupon,
        uses_count: coupon._count.purchases,
        is_expired: coupon.valid_until ? new Date() > coupon.valid_until : false,
        is_not_started: coupon.valid_from ? new Date() < coupon.valid_from : false
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil((total as number) / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao listar cupons de desconto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar cupom de desconto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createDiscountCouponSchema.parse(body)

    // Validações específicas por tipo
    if (validatedData.type === 'PERMANENT_25' && validatedData.discount_percent !== 25) {
      return NextResponse.json(
        { error: 'Cupons permanentes devem ter 25% de desconto' },
        { status: 400 }
      )
    }

    if (validatedData.type === 'SPECIAL_50' && validatedData.discount_percent !== 50) {
      return NextResponse.json(
        { error: 'Cupons especiais devem ter 50% de desconto' },
        { status: 400 }
      )
    }

    if (validatedData.type === 'SPECIAL_50' && (!validatedData.valid_from || !validatedData.valid_until)) {
      return NextResponse.json(
        { error: 'Cupons especiais devem ter data de início e fim definidas' },
        { status: 400 }
      )
    }

    // Verificar se o código já existe
    const existingCoupon = await prismaWithRetry.discountCoupon.findUnique({
      where: { code: validatedData.code.toUpperCase() }
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Código de cupom já existe' },
        { status: 400 }
      )
    }

    const coupon = await prismaWithRetry.discountCoupon.create({
      data: {
        ...validatedData,
        code: validatedData.code.toUpperCase(),
        valid_from: validatedData.valid_from ? new Date(validatedData.valid_from) : null,
        valid_until: validatedData.valid_until ? new Date(validatedData.valid_until) : null
      }
    })

    return NextResponse.json(coupon, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: (error as any).errors },
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