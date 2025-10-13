import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'

// GET - Listar produtos por categoria (API pública)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'ID de categoria inválido' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') || 'desc'

    const skip = (page - 1) * limit

    // Verificar se a categoria existe e está ativa
    const category = await prismaWithRetry.category.findUnique({
      where: { 
        id: categoryId,
        active: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const where = {
      category_id: categoryId,
      active: true
    }

    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.price_cents = sortOrder
    } else if (sortBy === 'name') {
      orderBy.title = sortOrder
    } else {
      orderBy.created_at = sortOrder
    }

    const [products, total] = await Promise.all([
      prismaWithRetry.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          description: true,
          price_cents: true,
          images: true,
          stock: true,
          created_at: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      } as any),
      prismaWithRetry.product.count({ where })
    ])

    return NextResponse.json({
      category,
      products: products.map((product: any) => ({
        ...product,
        images: JSON.parse(product.images)
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}