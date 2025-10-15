import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { getPayment } from '@/lib/mercadopago'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { Prisma } from '@prisma/client'

interface SessionWithUser {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

type OrderWithUser = Prisma.OrderGetPayload<{
  include: {
    user: true
    order_items: {
      include: { product: true }
    }
  }
}>

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUser | null

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar todos os pedidos pendentes
    const pendingOrders = await prismaWithRetry.order.findMany({
      where: { 
        status: 'PENDING',
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      include: {
        user: true,
        order_items: {
          include: { product: true }
        }
      }
    })

    console.log(`Encontrados ${pendingOrders.length} pedidos pendentes para sincronizar`)

    const results = {
      total: pendingOrders.length,
      updated: 0,
      errors: 0,
      details: [] as any[]
    }

    // Para cada pedido pendente, verificar no Mercado Pago
    for (const order of pendingOrders) {
      try {
        // Buscar pagamentos relacionados a este pedido
        const payments = await prismaWithRetry.payment.findMany({
          where: { 
            order_id: order.id,
            mp_payment_id: { not: null }
          }
        })

        let orderUpdated = false

        // Verificar cada pagamento no Mercado Pago
        for (const payment of payments) {
          if (payment.mp_payment_id) {
            try {
              const mpPayment = await getPayment(payment.mp_payment_id)
              
              if (mpPayment && mpPayment.status === 'approved') {
                // Atualizar status do pedido
                await prismaWithRetry.order.update({
                  where: { id: order.id },
                  data: { status: 'PAID' }
                })

                // Atualizar status do pagamento
                await prismaWithRetry.payment.update({
                  where: { id: payment.id },
                  data: { status: 'APPROVED' }
                })

                // Enviar e-mail de confirmação
                const orderWithUser = order as any
                if (orderWithUser.user?.email) {
                  try {
                    const items = orderWithUser.order_items?.map((item: any) => ({
                      name: item.product.title,
                      quantity: item.quantity,
                      priceCents: item.price_cents
                    })) || []

                    await sendOrderConfirmationEmail({
                      to: orderWithUser.user.email,
                      orderId: order.id,
                      customerName: orderWithUser.user.name,
                      totalCents: order.total_cents,
                      items
                    })
                  } catch (emailError) {
                    console.error('Erro ao enviar e-mail:', emailError)
                  }
                }

                orderUpdated = true
                results.updated++
                results.details.push({
                  orderId: order.id,
                  status: 'updated',
                  message: 'Pedido atualizado para PAID'
                })
                break
              }
            } catch (mpError) {
              console.error(`Erro ao verificar pagamento ${payment.mp_payment_id}:`, mpError)
            }
          }
        }

        if (!orderUpdated) {
          results.details.push({
            orderId: order.id,
            status: 'no_change',
            message: 'Nenhuma alteração necessária'
          })
        }

      } catch (error) {
        console.error(`Erro ao processar pedido ${order.id}:`, error)
        results.errors++
        results.details.push({
          orderId: order.id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${results.updated} pedidos atualizados`,
      results
    })

  } catch (error) {
    console.error('Erro na sincronização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}