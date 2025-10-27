import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    // Se não foi fornecida uma data, usar hoje
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    
    // Definir início e fim do dia
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    console.log('📊 Buscando compras de cartões de desconto para:', {
      date: targetDate.toISOString().split('T')[0],
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    })

    // Buscar compras de cartões de desconto do dia
    const dailyPurchases = await prismaWithRetry.discountCouponPurchase.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discount_coupon: {
          select: {
            id: true,
            type: true,
            discount_percent: true,
            sale_price_cents: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            total_cents: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Calcular estatísticas do dia
    const totalPurchases = dailyPurchases.length
    const totalRevenue = dailyPurchases.reduce((sum, purchase) => {
      return sum + ((purchase as any).discount_coupon?.sale_price_cents || 0)
    }, 0)

    const purchasesByType = dailyPurchases.reduce((acc, purchase) => {
      const type = (purchase as any).discount_coupon?.type
      if (!type) return acc
      
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          revenue: 0,
          percentage: (purchase as any).discount_coupon?.discount_percent || 0
        }
      }
      acc[type].count++
      acc[type].revenue += (purchase as any).discount_coupon?.sale_price_cents || 0
      return acc
    }, {} as Record<string, { count: number; revenue: number; percentage: number }>)

    // Formatar dados para exibição
    const formattedPurchases = dailyPurchases.map(purchase => ({
      id: purchase.id,
      code: purchase.code,
      created_at: purchase.created_at,
      buyer: {
        id: (purchase as any).buyer?.id,
        name: (purchase as any).buyer?.name,
        email: (purchase as any).buyer?.email
      },
      coupon_type: (purchase as any).discount_coupon?.type,
      discount_percent: (purchase as any).discount_coupon?.discount_percent || 0,
      sale_price_cents: (purchase as any).discount_coupon?.sale_price_cents || 0,
      status: purchase.used_at ? 'USADO' : 'DISPONÍVEL',
      used_at: purchase.used_at,
      expires_at: purchase.expires_at,
      order_id: (purchase as any).order?.id,
      order_status: (purchase as any).order?.status
    }))

    const response = {
      date: targetDate.toISOString().split('T')[0],
      summary: {
        total_purchases: totalPurchases,
        total_revenue_cents: totalRevenue,
        purchases_by_type: purchasesByType
      },
      purchases: formattedPurchases
    }

    console.log('✅ Relatório diário gerado:', {
      date: response.date,
      total_purchases: totalPurchases,
      total_revenue: `R$ ${(totalRevenue / 100).toFixed(2)}`
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Erro ao gerar relatório diário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}