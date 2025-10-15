import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

interface SessionUser {
  id: string;
  role: string;
}

interface SessionWithUser {
  user: SessionUser;
}

interface ExistingCategory {
  id: number
  name: string
  description: string | null
  active: boolean
}

interface CategoryWithCount {
  id: number
  _count: {
    products: number
  }
}

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  description: z.string().optional(),
  active: z.boolean().optional()
})

// GET - Buscar categoria por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const category = await prismaWithRetry.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            price_cents: true,
            active: true
          },
          take: 10 // Limitar a 10 produtos para não sobrecarregar
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Verificar se a categoria existe
    const existingCategory = await prismaWithRetry.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        description: true,
        active: true
      }
    }) as ExistingCategory | null

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    // Se está alterando o nome, verificar se não existe outra categoria com o mesmo nome
    if (validatedData.name && existingCategory && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prismaWithRetry.category.findFirst({
        where: {
          name: validatedData.name,
          id: {
            not: categoryId
          }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Já existe uma categoria com este nome' },
          { status: 400 }
        )
      }
    }

    const updatedCategory = await prismaWithRetry.category.update({
      where: { id: categoryId },
      data: validatedData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    } as any)

    return NextResponse.json(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar se a categoria existe
    const existingCategory = await prismaWithRetry.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    }) as CategoryWithCount | null

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    // Verificar se há produtos associados à categoria
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível deletar categoria com produtos associados',
          details: `Esta categoria possui ${existingCategory._count.products} produto(s) associado(s)`
        },
        { status: 400 }
      )
    }

    await prismaWithRetry.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ message: 'Categoria deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}