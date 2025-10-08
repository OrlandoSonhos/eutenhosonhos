import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = {
      active: true,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      })
    }

    const [products, total] = await Promise.all([
      prismaWithRetry.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prismaWithRetry.product.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}