import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha deve ter pelo menos 6 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
})

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório')
})

// GET - Validar token de reset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token não fornecido' },
        { status: 400 }
      )
    }

    const { token: validatedToken } = validateTokenSchema.parse({ token })

    // Buscar token válido
    const passwordReset = await prismaWithRetry.passwordReset.findFirst({
      where: {
        token: validatedToken,
        used_at: null,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!passwordReset) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        name: (passwordReset as any).user.name,
        email: (passwordReset as any).user.email
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao validar token:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Redefinir senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = resetPasswordSchema.parse(body)

    // Buscar token válido
    const passwordReset = await prismaWithRetry.passwordReset.findFirst({
      where: {
        token,
        used_at: null,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    })

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Atualizar senha e marcar token como usado em uma transação
    await prismaWithRetry.$transaction(async (tx) => {
      // Atualizar senha do usuário
      await tx.user.update({
        where: { id: (passwordReset as any).user_id },
        data: {
          password_hash: hashedPassword,
          updated_at: new Date()
        }
      })

      // Marcar token como usado
      await tx.passwordReset.update({
        where: { id: passwordReset.id },
        data: {
          used_at: new Date()
        }
      })

      // Invalidar todos os outros tokens do usuário
      await tx.passwordReset.updateMany({
        where: {
          user_id: (passwordReset as any).user_id,
          id: {
            not: (passwordReset as any).id
          },
          used_at: null
        },
        data: {
          used_at: new Date()
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}