import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Estatísticas de produtos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Estatísticas gerais
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      totalRevenue,
      totalSales,
      topSellingProducts,
      recentProducts
    ] = await Promise.all([
      // Total de produtos
      prisma.product.count(),
      
      // Produtos ativos
      prisma.product.count({ where: { active: true } }),
      
      // Produtos inativos
      prisma.product.count({ where: { active: false } }),
      
      // Produtos sem estoque
      prisma.product.count({ where: { stock: 0 } }),
      
      // Receita total
      prisma.orderItem.aggregate({
        _sum: {
          price_cents: true
        },
        where: {
          order: {
            status: 'PAID'
          }
        }
      }),
      
      // Total de vendas
      prisma.orderItem.aggregate({
        _sum: {
          quantity: true
        },
        where: {
          order: {
            status: 'PAID'
          }
        }
      }),
      
      // Produtos mais vendidos
      prisma.product.findMany({
        include: {
          order_items: {
            where: {
              order: {
                status: 'PAID'
              }
            }
          },
          _count: {
            select: {
              order_items: {
                where: {
                  order: {
                    status: 'PAID'
                  }
                }
              }
            }
          }
        },
        orderBy: {
          order_items: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // Produtos recentes
      prisma.product.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { order_items: true }
          }
        }
      })
    ])

    // Calcular estatísticas dos produtos mais vendidos
    const topProducts = topSellingProducts.map((product: any) => {
      const totalQuantity = product.order_items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)
      const totalRevenue = product.order_items.reduce((sum: number, item: { price_cents: number; quantity: number }) => sum + (item.price_cents * item.quantity), 0)
      
      return {
        id: product.id,
        title: product.title,
        images: JSON.parse(product.images),
        price_cents: product.price_cents,
        stock: product.stock,
        active: product.active,
        sales_count: totalQuantity,
        revenue: totalRevenue
      }
    })

    // Estatísticas por categoria (se houver campo categoria no futuro)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
          gt: 0
        },
        active: true
      },
      orderBy: { stock: 'asc' },
      take: 10,
      select: {
        id: true,
        title: true,
        stock: true,
        images: true
      }
    })

    return NextResponse.json({
      overview: {
        total_products: totalProducts,
        active_products: activeProducts,
        inactive_products: inactiveProducts,
        out_of_stock_products: outOfStockProducts,
        total_revenue: totalRevenue._sum.price_cents || 0,
        total_sales: totalSales._sum.quantity || 0
      },
      top_selling_products: topProducts,
      recent_products: recentProducts.map((product: any) => ({
        ...product,
        images: JSON.parse(product.images),
        sales_count: product._count.order_items
      })),
      low_stock_products: lowStockProducts.map((product: { id: string; title: string; stock: number; images: string }) => ({
        ...product,
        images: JSON.parse(product.images)
      }))
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas de produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
