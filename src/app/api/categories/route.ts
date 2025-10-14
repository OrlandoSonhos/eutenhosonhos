import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'

// GET - Listar categorias ativas (API pública)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCount = searchParams.get('includeCount') === 'true'

    const categories = await prismaWithRetry.category.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        ...(includeCount && {
          _count: {
            select: {
              products: {
                where: {
                  active: true
                }
              }
            }
          }
        })
      }
    } as any)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}