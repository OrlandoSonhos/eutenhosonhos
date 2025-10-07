import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProductSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').optional(),
  price_cents: z.number().min(1, 'Preço deve ser maior que zero').optional(),
  stock: z.number().min(0, 'Estoque não pode ser negativo').optional(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é obrigatória').optional(),
  active: z.boolean().optional()
})

// GET - Buscar produto específico (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id: id },
      include: {
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
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const productData = updateProductSchema.parse(body)

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {
      ...productData
    }
    
    // Converter images array para string JSON se fornecido
    if (productData.images) {
      updateData.images = JSON.stringify(productData.images)
    }

    const product = await prisma.product.update({
      where: { id: id },
      data: updateData
    })

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
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
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

    await prisma.product.delete({
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