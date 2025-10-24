import { NextRequest, NextResponse } from 'next/server'
import { prismaWithRetry } from '@/lib/prisma-utils'
import { z } from 'zod'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

// POST - Solicitar reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Verificar se o usuário existe
    const user = await prismaWithRetry.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Sempre retornar sucesso por segurança (não revelar se email existe)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha'
      })
    }

    // Invalidar tokens anteriores do usuário
    await prismaWithRetry.passwordReset.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
        expires_at: {
          gt: new Date()
        }
      },
      data: {
        used_at: new Date()
      }
    })

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex')
    const expires_at = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Criar registro de reset
    await prismaWithRetry.passwordReset.create({
      data: {
        user_id: user.id,
        token,
        expires_at
      }
    })

    // Enviar email (implementar conforme sua configuração de email)
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Redefinição de Senha - ETS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Redefinição de Senha</h2>
            <p>Olá ${user.name},</p>
            <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <p>
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Redefinir Senha
              </a>
            </p>
            <p>Este link é válido por 1 hora.</p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              ${resetUrl}
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      // Continuar mesmo se o email falhar
    }

    return NextResponse.json({
      success: true,
      message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Email inválido', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao processar solicitação de reset:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}