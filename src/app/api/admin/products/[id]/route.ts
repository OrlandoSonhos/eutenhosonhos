import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'

const updateProductSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').optional(),
  price_cents: z.number().min(1, 'Preço deve ser maior que zero').optional(),
  stock: z.number().min(0, 'Estoque não pode ser negativo').optional(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é obrigatória').optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  category_id: z.string().nullable().optional(),
  is_auction: z.boolean().optional(),
  auction_date: z.string().datetime().nullable().optional(),
  auction_end_date: z.string().datetime().nullable().optional()
})

// GET - Buscar produto específico (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    const product = await (prismaWithRetry.product.findUnique as any)({
      where: { id: id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        order_items: {
          include: {
            order: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        _count: {
          select: { order_items: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      product: {
        ...product,
        images: JSON.parse(product.images),
        sales_count: product._count.order_items,
        total_revenue: product.order_items.reduce((sum: number, item: { price_cents: number; quantity: number }) =>
          sum + (item.price_cents * item.quantity), 0
        )
      }
    })

  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const productData = updateProductSchema.parse(body)

    // Verificar se o produto existe
    const existingProduct = await prismaWithRetry.product.findUnique({
      where: { id: id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Validar categoria se fornecida
    if (productData.category_id !== undefined) {
      if (productData.category_id !== null) {
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
    }

    // Validar datas de leilão
    if (productData.is_auction && productData.auction_date && productData.auction_end_date) {
      const startDate = new Date(productData.auction_date)
      const endDate = new Date(productData.auction_end_date)

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'A data de fim do leilão deve ser posterior à data de início' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      ...productData
    }
    
    // Se não é mais produto de leilão, limpar as datas
    if (productData.is_auction === false) {
      updateData.auction_date = null
      updateData.auction_end_date = null
    }
    
    // Converter images array para string JSON se fornecido
    if (productData.images) {
      updateData.images = JSON.stringify(productData.images)
    }

    // Converter datas para Date objects se fornecidas
    if (productData.auction_date) {
      updateData.auction_date = new Date(productData.auction_date)
    }
    if (productData.auction_end_date) {
      updateData.auction_end_date = new Date(productData.auction_end_date)
    }

    const product = await prismaWithRetry.product.update({
      where: { id: id },
      data: updateData,
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
    })

  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    
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

// DELETE - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar se o produto existe
    const existingProduct = await (prismaWithRetry.product.findUnique as any)({
      where: { id: id },
      include: {
        _count: {
          select: { order_items: true }
        }
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o produto tem vendas
    if (existingProduct._count.order_items > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir produto que já possui vendas. Desative-o em vez disso.' },
        { status: 400 }
      )
    }

    await prismaWithRetry.product.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}