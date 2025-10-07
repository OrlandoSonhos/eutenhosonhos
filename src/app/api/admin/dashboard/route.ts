import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
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
      recentOrders,
      recentCoupons,
      payments
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de pedidos
      prisma.order.count(),
      
      // Total de cupons
      prisma.coupon.count(),
      
      // Cupons utilizados
      prisma.coupon.count({
        where: { status: 'USED' }
      }),
      
      // Cupons disponíveis
      prisma.coupon.count({
        where: { status: 'AVAILABLE' }
      }),
      
      // Pedidos recentes
      prisma.order.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      
      // Cupons recentes
      prisma.coupon.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          buyer: {
            select: { name: true, email: true }
          }
        }
      }),
      
      // Pagamentos para calcular receita
      prisma.payment.findMany({
        where: { status: 'APPROVED' }
      })
    ])

    // Calcular receita total
    const totalRevenue = payments.reduce((sum, payment) => {
      return sum + payment.amount_cents
    }, 0)

    // Preparar dados de resposta
    const dashboardData = {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalCoupons,
      couponsUsed,
      couponsAvailable,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        total_cents: order.total_cents,
        status: order.status,
        created_at: order.created_at,
        user: order.user
      })),
      recentCoupons: recentCoupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        face_value_cents: coupon.face_value_cents,
        status: coupon.status,
        created_at: coupon.created_at,
        buyer: coupon.buyer
      })),
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