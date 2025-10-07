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

    const coupons = await prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        buyer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(coupons)

  } catch (error) {
    console.error('Erro ao buscar cupons:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { code, face_value_cents, quantity } = await request.json()

    if (!code || !face_value_cents || !quantity) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Criar múltiplos cupons com códigos únicos
    const coupons = []
    for (let i = 0; i < quantity; i++) {
      const uniqueCode = quantity === 1 ? code : `${code}-${String(i + 1).padStart(3, '0')}`
      
      // Verificar se o código já existe
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: uniqueCode }
      })

      if (existingCoupon) {
        return NextResponse.json(
          { error: `Cupom com código ${uniqueCode} já existe` },
          { status: 400 }
        )
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: uniqueCode,
          face_value_cents: parseInt(face_value_cents),
          sale_price_cents: parseInt(face_value_cents), // Mesmo valor por padrão
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          status: 'AVAILABLE'
        }
      })

      coupons.push(coupon)
    }

    return NextResponse.json({ 
      message: `${coupons.length} cupom(ns) criado(s) com sucesso`,
      coupons 
    })

  } catch (error) {
    console.error('Erro ao criar cupons:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}