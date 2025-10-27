import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const updateDiscountCouponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').max(20, 'Código deve ter no máximo 20 caracteres').optional(),
  discount_percent: z.number().min(1).max(100, 'Desconto deve estar entre 1% e 100%').optional(),
  type: z.enum(['PERMANENT_25', 'SPECIAL_50']).optional(),
  sale_price_cents: z.union([z.number().min(0), z.null(), z.undefined()]).optional(),
  is_active: z.boolean().optional(),
  valid_from: z.union([z.string().datetime(), z.null(), z.undefined()]).optional(),
  valid_until: z.union([z.string().datetime(), z.null(), z.undefined()]).optional(),
  max_uses: z.union([z.number().min(1), z.null(), z.undefined()]).optional()
})

// GET - Obter cupom específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const coupon = await prismaWithRetry.discountCoupon.findUnique({
      where: { id },
      include: {
        uses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            order: {
              select: {
                id: true,
                total_cents: true,
                created_at: true
              }
            }
          },
          orderBy: { used_at: 'desc' }
        },
        _count: {
          select: { uses: true }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...(coupon as any),
      uses_count: (coupon as any)._count?.uses || 0,
      is_expired: (coupon as any).valid_until ? new Date() > (coupon as any).valid_until : false,
      is_not_started: (coupon as any).valid_from ? new Date() < (coupon as any).valid_from : false
    })

  } catch (error) {
    console.error('Erro ao obter cupom:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar cupom
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('PUT /api/admin/discount-coupons/[id] - Iniciando atualização do cupom:', id)
    
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      console.log('PUT /api/admin/discount-coupons/[id] - Acesso negado')
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('PUT /api/admin/discount-coupons/[id] - Body recebido:', JSON.stringify(body, null, 2))
    
    const validatedData = updateDiscountCouponSchema.parse(body)
    console.log('PUT /api/admin/discount-coupons/[id] - Dados validados:', JSON.stringify(validatedData, null, 2))

    // Verificar se o cupom existe
    const existingCoupon = await prismaWithRetry.discountCoupon.findUnique({
      where: { id }
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      )
    }

    // Validações específicas por tipo
    if (validatedData.type === 'PERMANENT_25' && validatedData.discount_percent && validatedData.discount_percent !== 20) {
      return NextResponse.json(
        { error: 'Cupons permanentes devem ter 20% de desconto' },
        { status: 400 }
      )
    }

    if (validatedData.type === 'SPECIAL_50' && validatedData.discount_percent && validatedData.discount_percent !== 50) {
      return NextResponse.json(
        { error: 'Cupons especiais devem ter 50% de desconto' },
        { status: 400 }
      )
    }

    // Se é ou está mudando para SPECIAL_50, verificar se tem datas
    const finalType = validatedData.type || (existingCoupon as any).type
    if (finalType === 'SPECIAL_50') {
      const finalValidFrom = validatedData.valid_from || (existingCoupon as any).valid_from
      const finalValidUntil = validatedData.valid_until || (existingCoupon as any).valid_until
      
      if (!finalValidFrom || !finalValidUntil) {
        return NextResponse.json(
          { error: 'Cupons especiais devem ter data de início e fim definidas' },
          { status: 400 }
        )
      }
    }

    // Verificar se o código já existe (se estiver sendo alterado)
    if (validatedData.code && validatedData.code.toUpperCase() !== (existingCoupon as any).code) {
      const codeExists = await prismaWithRetry.discountCoupon.findUnique({
        where: { code: validatedData.code.toUpperCase() }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Código de cupom já existe' },
          { status: 400 }
        )
      }
    }

    console.log('PUT /api/admin/discount-coupons/[id] - Preparando dados para atualização')
    const updateData = {
      ...validatedData,
      ...(validatedData.code && { code: validatedData.code.toUpperCase() }),
      ...(validatedData.valid_from && { valid_from: new Date(validatedData.valid_from) }),
      ...(validatedData.valid_until && { valid_until: new Date(validatedData.valid_until) })
    }
    console.log('PUT /api/admin/discount-coupons/[id] - Dados para atualização:', JSON.stringify(updateData, null, 2))

    const updatedCoupon = await prismaWithRetry.discountCoupon.update({
      where: { id },
      data: updateData
    })

    console.log('PUT /api/admin/discount-coupons/[id] - Cupom atualizado com sucesso:', updatedCoupon.id)
    return NextResponse.json(updatedCoupon)

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('PUT /api/admin/discount-coupons/[id] - Erro de validação Zod')
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('PUT /api/admin/discount-coupons/[id] - ERRO INTERNO DETALHADO:')
    console.error('PUT /api/admin/discount-coupons/[id] - Tipo do erro:', typeof error)
    console.error('PUT /api/admin/discount-coupons/[id] - Erro completo:', error)
    console.error('PUT /api/admin/discount-coupons/[id] - Mensagem do erro:', error instanceof Error ? error.message : 'Sem mensagem')
    console.error('PUT /api/admin/discount-coupons/[id] - Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('PUT /api/admin/discount-coupons/[id] - Código do erro:', (error as any).code)
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir cupom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verificar se o cupom existe
    const existingCoupon = await prismaWithRetry.discountCoupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { uses: true }
        }
      }
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o cupom já foi usado
    if ((existingCoupon as any)._count.uses > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar cupom que já foi utilizado' },
        { status: 400 }
      )
    }

    await prismaWithRetry.discountCoupon.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Cupom deletado com sucesso' })

  } catch (error) {
    console.error('Erro ao deletar cupom:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}