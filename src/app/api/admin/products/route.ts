import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const createProductSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price_cents: z.number().min(1, 'Preço deve ser maior que zero'),
  stock: z.number().min(0, 'Estoque não pode ser negativo'),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é obrigatória'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  category_id: z.string().nullable().optional(),
  // Campos de frete (opcionais)
  weight_grams: z.number().int().min(0).optional(),
  length_cm: z.number().min(0).optional(),
  width_cm: z.number().min(0).optional(),
  height_cm: z.number().min(0).optional()
})

// GET - Listar produtos (admin)
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
    const categoryId = searchParams.get('category_id')

    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      }),
      ...(active !== null && active !== undefined && { active: active === 'true' }),
      ...(categoryId && { category_id: categoryId })
    }

    const [products, total] = await Promise.all([
      prismaWithRetry.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: { order_items: true }
          }
        }
      } as any),
      prismaWithRetry.product.count({ where })
    ])

    return NextResponse.json({
      products: products.map((product: any) => ({
        ...product,
        images: JSON.parse(product.images),
        sales_count: product._count.order_items
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar produto
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
    const productData = createProductSchema.parse(body)

    // Validar se a categoria existe (se fornecida)
    if (productData.category_id) {
      const categoryExists = await prismaWithRetry.category.findUnique({
        where: { id: productData.category_id },
        select: {
          id: true
        }
      }) as { id: string } | null

      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 400 }
        )
      }
    }

    const product = await prismaWithRetry.product.create({
      data: {
        ...productData,
        images: JSON.stringify(productData.images)
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    } as any)

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        images: JSON.parse(product.images)
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar produto:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
