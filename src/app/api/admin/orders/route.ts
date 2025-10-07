import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            status: true,
            method: true,
            mp_payment_id: true
          }
        },
        order_items: {
          include: {
            product: {
              select: {
                title: true,
                price_cents: true
              }
            }
          }
        },
        used_coupons: {
          select: {
            code: true,
            face_value_cents: true
          }
        }
      }
    })

    return NextResponse.json(orders)

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
