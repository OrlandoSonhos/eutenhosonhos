import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'

// GET - Buscar categoria específica (API pública)
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

    const category = await prismaWithRetry.category.findUnique({
      where: { 
        id: categoryId,
        active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        _count: {
          select: {
            products: {
              where: {
                active: true
              }
            }
          }
        }
      }
    } as any)

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}