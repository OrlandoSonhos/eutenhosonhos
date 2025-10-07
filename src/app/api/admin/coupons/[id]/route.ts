import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar se o cupom existe
    const coupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir deletar cupons já utilizados
    if (coupon.status === 'USED') {
      return NextResponse.json(
        { error: 'Não é possível deletar cupons já utilizados' },
        { status: 400 }
      )
    }

    // Deletar o cupom
    await prisma.coupon.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Cupom deletado com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao deletar cupom:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}