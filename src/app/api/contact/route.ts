import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const contactSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, email, whatsapp, assunto, mensagem } = contactSchema.parse(body)

    // Mapear assuntos para texto legível
    const assuntoMap: { [key: string]: string } = {
      'duvida-produto': 'Dúvida sobre produto',
      'problema-pedido': 'Problema com pedido',
      'sugestao': 'Sugestão',
      'parceria': 'Parceria comercial',
      'outro': 'Outro'
    }

    const assuntoTexto = assuntoMap[assunto] || assunto

    // Preparar conteúdo do email
    const emailSubject = `[Contato Site] ${assuntoTexto} - ${nome}`
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Nova mensagem de contato</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h3 style="color: #495057; margin-top: 0;">Informações do contato:</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057; width: 120px;">Nome:</td>
              <td style="padding: 8px 0; color: #333;">${nome}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Email:</td>
              <td style="padding: 8px 0; color: #333;">${email}</td>
            </tr>
            ${whatsapp ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">WhatsApp:</td>
              <td style="padding: 8px 0; color: #333;">${whatsapp}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #495057;">Assunto:</td>
              <td style="padding: 8px 0; color: #333;">${assuntoTexto}</td>
            </tr>
          </table>
          
          <h3 style="color: #495057; margin-top: 20px; margin-bottom: 10px;">Mensagem:</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
            ${mensagem.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 8px; border: 1px solid #b3d9ff;">
          <p style="margin: 0; color: #0066cc; font-size: 14px;">
            <strong>📧 Responder para:</strong> ${email}<br>
            ${whatsapp ? `<strong>📱 WhatsApp:</strong> ${whatsapp}<br>` : ''}
            <strong>🕒 Recebido em:</strong> ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    `

    // Enviar email
    await sendEmail({
      to: 'eutenhosonhos5@gmail.com',
      subject: emailSubject,
      html: emailContent
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!' 
    })

  } catch (error) {
    console.error('Erro ao processar contato:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}