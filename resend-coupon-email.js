const sgMail = require('@sendgrid/mail')

// Configurar SendGrid
const apiKey = process.env.SENDGRID_API_KEY
if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY não configurada!')
  console.log('📝 Configure com: vercel env add SENDGRID_API_KEY production')
  process.exit(1)
}

sgMail.setApiKey(apiKey)

async function resendCouponEmail() {
  try {
    console.log('📧 Testando envio de e-mail do cupom...')
    
    // Dados do cupom de 1:54 (baseado no webhook recebido)
    const couponData = {
      code: 'CUPOM-1-54', // Código fictício para teste
      value: 0.01,
      buyerEmail: 'eutenhosonhos5@gmail.com', // E-mail do sistema
      buyerName: 'Teste Cupom',
      paymentId: '130130094686', // ID do pagamento real
      createdAt: new Date('2025-10-21T01:54:00.000Z')
    }
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seu Cupom EuTenhoSonhos</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">🎫 Seu Cupom EuTenhoSonhos</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-top: 0;">Parabéns! Seu cupom foi gerado com sucesso!</h2>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border: 2px dashed #2563eb; text-align: center; margin: 20px 0;">
          <h3 style="color: #1e40af; margin: 0; font-size: 24px; letter-spacing: 2px;">
            ${couponData.code}
          </h3>
          <p style="margin: 5px 0; color: #64748b;">Código do Cupom</p>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>💰 Valor:</strong> R$ ${couponData.value.toFixed(2)}</p>
          <p><strong>📅 Gerado em:</strong> ${couponData.createdAt.toLocaleString('pt-BR')}</p>
          <p><strong>💳 Pagamento:</strong> ${couponData.paymentId}</p>
        </div>
      </div>
      
      <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
        <h3 style="color: #047857; margin-top: 0;">Como usar seu cupom:</h3>
        <ol style="color: #065f46;">
          <li>Acesse: <a href="https://eutenhosonhos.com.br" style="color: #2563eb;">eutenhosonhos.com.br</a></li>
          <li>Escolha seus produtos</li>
          <li>No checkout, insira o código: <strong>${couponData.code}</strong></li>
          <li>Aproveite seu desconto!</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; margin: 0;">
          📧 eutenhosonhos5@gmail.com | 🌐 eutenhosonhos.com.br
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
          Este é um e-mail automático de teste do sistema.
        </p>
      </div>
    </body>
    </html>
    `
    
    const msg = {
      to: couponData.buyerEmail,
      from: {
        email: 'eutenhosonhos5@gmail.com',
        name: 'EuTenhoSonhos'
      },
      subject: `🎫 Seu Cupom ${couponData.code} - EuTenhoSonhos`,
      html: emailHtml
    }
    
    console.log('📤 Enviando e-mail...')
    const response = await sgMail.send(msg)
    
    console.log('✅ E-mail enviado com sucesso!')
    console.log('📊 Status:', response[0].statusCode)
    console.log('📧 Para:', couponData.buyerEmail)
    console.log('🎫 Cupom:', couponData.code)
    
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message)
    if (error.response) {
      console.error('📋 Detalhes:', error.response.body)
    }
  }
}

// Verificar se tem API key antes de tentar enviar
if (apiKey) {
  resendCouponEmail()
} else {
  console.log('⚠️  Configure a SENDGRID_API_KEY primeiro!')
}