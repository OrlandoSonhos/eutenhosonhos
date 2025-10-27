import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Excluir restrição específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar se a restrição existe
    const restriction = await prisma.couponCategoryRestriction.findUnique({
      where: { id }
    })

    if (!restriction) {
      return NextResponse.json(
        { error: 'Restrição não encontrada' },
        { status: 404 }
      )
    }

    // Excluir a restrição
    await prisma.couponCategoryRestriction.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Restrição excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir restrição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}