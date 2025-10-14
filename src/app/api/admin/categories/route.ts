import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional()
})

// GET - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = {}

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const categories = await prismaWithRetry.category.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    } as any)

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await prismaWithRetry.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      )
    }

    const category = await prismaWithRetry.category.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    } as any)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}