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
  active: z.boolean().default(true)
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

    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(active !== null && active !== undefined && { active: active === 'true' })
    }

    const [products, total] = await Promise.all([
      prismaWithRetry.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { order_items: true }
          }
        }
      }),
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

    const product = await prismaWithRetry.product.create({
      data: {
        ...productData,
        images: JSON.stringify(productData.images)
      }
    })

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
