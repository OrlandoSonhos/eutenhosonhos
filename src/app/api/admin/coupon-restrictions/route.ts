import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRestrictionSchema = z.object({
  coupon_type: z.enum(['PERMANENT_25', 'SPECIAL_50']),
  category_id: z.string().min(1, 'ID da categoria é obrigatório'),
  restriction_type: z.enum(['ALLOWED', 'FORBIDDEN'])
})

// GET - Listar restrições de cupons
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const restrictions = await prisma.couponCategoryRestriction.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      restrictions
    })

  } catch (error) {
    console.error('Erro ao buscar restrições:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova restrição
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
    const { coupon_type, category_id, restriction_type } = createRestrictionSchema.parse(body)

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: category_id }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe uma restrição para este cupom e categoria
    const existingRestriction = await prisma.couponCategoryRestriction.findFirst({
      where: {
        coupon_type,
        category_id
      }
    })

    if (existingRestriction) {
      return NextResponse.json(
        { error: 'Já existe uma restrição para este cupom e categoria' },
        { status: 400 }
      )
    }

    // Criar a restrição
    const restriction = await prisma.couponCategoryRestriction.create({
      data: {
        coupon_type,
        category_id,
        restriction_type
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      restriction,
      message: 'Restrição criada com sucesso'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.issues
        },
        { status: 400 }
      )
    }

    console.error('Erro ao criar restrição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}