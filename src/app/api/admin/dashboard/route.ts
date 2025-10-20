import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'

interface SessionUser {
  role: string;
}

interface SessionWithUser {
  user: SessionUser;
}

interface OrderWithUser {
  id: string;
  total_cents: number;
  status: string;
  created_at: Date;
  user: {
    name: string;
    email: string;
  } | null;
}

interface CouponWithBuyer {
  id: string;
  code: string;
  face_value_cents: number;
  status: string;
  created_at: Date;
  buyer: {
    name: string;
    email: string;
  } | null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null

    if (!session || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar estatísticas gerais
    const [
      totalUsers,
      totalOrders,
      totalCoupons,
      couponsUsed,
      couponsAvailable,
      recentOrdersRaw,
      recentCouponsRaw,
      payments
    ] = await Promise.all([
      // Total de usuários
      prismaWithRetry.user.count(),
      
      // Total de pedidos
      prismaWithRetry.order.count(),
      
      // Total de cupons
      prismaWithRetry.coupon.count(),
      
      // Cupons utilizados
      prismaWithRetry.coupon.count({
        where: { status: 'USED' }
      }),
      
      // Cupons disponíveis
      prismaWithRetry.coupon.count({
        where: { status: 'AVAILABLE' }
      }),
      
      // Pedidos recentes
      prismaWithRetry.order.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      
      // Cupons recentes
      prismaWithRetry.coupon.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          buyer: {
            select: { name: true, email: true }
          }
        }
      }),
      
      // Pagamentos para calcular receita
      prismaWithRetry.payment.findMany({
        where: { status: 'APPROVED' }
      })
    ])

    // Calcular receita total
    const totalRevenue = payments.reduce((sum, payment) => {
      return sum + payment.amount_cents
    }, 0)

    // Mapear pedidos recentes
    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      total_cents: order.total_cents,
      status: order.status,
      created_at: order.created_at,
      user: (order as any).user ? {
        name: (order as any).user.name,
        email: (order as any).user.email
      } : null
    }))

    // Mapear cupons recentes
    const recentCoupons = recentCouponsRaw.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      face_value_cents: coupon.face_value_cents,
      status: coupon.status,
      created_at: coupon.created_at,
      buyer: (coupon as any).buyer ? {
        name: (coupon as any).buyer.name,
        email: (coupon as any).buyer.email
      } : null
    }))

    // Preparar dados de resposta
    const dashboardData = {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalCoupons,
      couponsUsed,
      couponsAvailable,
      recentOrders,
      recentCoupons,
      monthlyRevenue: [] // Implementar depois com dados mensais
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
