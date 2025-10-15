import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'

interface SessionWithUser {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar todos os dados relevantes
    const [orders, payments, coupons] = await Promise.all([
      prismaWithRetry.order.findMany({
        include: {
          user: {
            select: { name: true, email: true }
          },
          order_items: {
            include: {
              product: {
                select: { title: true }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      
      prismaWithRetry.payment.findMany({
        include: {
          order: {
            select: { id: true, total_cents: true }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      
      prismaWithRetry.coupon.findMany({
        include: {
          buyer: {
            select: { name: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' }
      })
    ])

    // Calcular estatísticas
    const stats = {
      totalOrders: orders.length,
      ordersByStatus: {
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        PAID: orders.filter(o => o.status === 'PAID').length,
        CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
      },
      totalPayments: payments.length,
      paymentsByStatus: {
        PENDING: payments.filter(p => p.status === 'PENDING').length,
        APPROVED: payments.filter(p => p.status === 'APPROVED').length,
        REJECTED: payments.filter(p => p.status === 'REJECTED').length
      },
      totalRevenue: payments
        .filter(p => p.status === 'APPROVED')
        .reduce((sum, p) => sum + p.amount_cents, 0),
      totalCoupons: coupons.length,
      couponsByStatus: {
        AVAILABLE: coupons.filter(c => c.status === 'AVAILABLE').length,
        USED: coupons.filter(c => c.status === 'USED').length
      }
    }

    return NextResponse.json({
      stats,
      orders: orders.slice(0, 10), // Últimos 10 pedidos
      payments: payments.slice(0, 10), // Últimos 10 pagamentos
      coupons: coupons.slice(0, 10) // Últimos 10 cupons
    })

  } catch (error) {
    console.error('Erro no debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}