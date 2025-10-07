import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmail } from '@/lib/email'

// Endpoint para testar o sistema de e-mails

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Dados de teste para o e-mail
    const testOrderData = {
      to: email,
      orderId: 'TEST-ORDER-123',
      customerName: 'João Silva',
      totalCents: 15999, // R$ 159,99
      items: [
        {
          name: 'Camiseta Básica',
          quantity: 2,
          priceCents: 4999
        },
        {
          name: 'Calça Jeans',
          quantity: 1,
          priceCents: 6001
        }
      ]
    }

    console.log('Enviando e-mail de teste para:', email)
    
    await sendOrderConfirmationEmail(testOrderData)

    console.log('E-mail de teste enviado com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'E-mail de confirmação enviado com sucesso!',
      testData: testOrderData
    })

  } catch (error) {
    console.error('Erro ao enviar e-mail de teste:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao enviar e-mail',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
