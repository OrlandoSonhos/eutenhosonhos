import { NextRequest, NextResponse } from 'next/server'
import { trackPackage } from '@/lib/correios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prismaWithRetry } from '@/lib/prisma-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const trackingCode = searchParams.get('code')
    const orderId = searchParams.get('orderId')

    if (!trackingCode && !orderId) {
      return NextResponse.json(
        { error: 'Código de rastreamento ou ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    let finalTrackingCode = trackingCode

    // Se foi fornecido orderId, buscar o código de rastreamento
    if (orderId && !trackingCode) {
      const order = await prismaWithRetry.order.findFirst({
        where: {
          id: orderId,
          user: { email: session.user.email }
        }
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        )
      }

      if (!order.tracking_code) {
        return NextResponse.json(
          { error: 'Código de rastreamento não disponível para este pedido' },
          { status: 404 }
        )
      }

      finalTrackingCode = order.tracking_code
    }

    if (!finalTrackingCode) {
      return NextResponse.json(
        { error: 'Código de rastreamento não encontrado' },
        { status: 400 }
      )
    }

    // Rastrear encomenda
    const trackingInfo = await trackPackage(finalTrackingCode)

    return NextResponse.json({
      success: true,
      tracking: trackingInfo
    })

  } catch (error) {
    console.error('Erro ao rastrear encomenda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Use GET para rastrear encomendas' }, { status: 405 })
}