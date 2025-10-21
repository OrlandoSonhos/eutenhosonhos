// Teste de envio de email do cupom
require('dotenv').config()

async function testCouponEmail() {
  try {
    console.log('📧 TESTANDO ENVIO DE EMAIL DO CUPOM...\n')

    console.log('🔧 Configurações de email:')
    console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA')
    console.log('   SMTP_USER:', process.env.SMTP_USER || 'NÃO CONFIGURADO')
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURADA' : 'NÃO CONFIGURADA')
    console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com')
    console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587')

    // Importar dinamicamente
    const { sendCouponEmail } = await import('./src/lib/email.ts')

    console.log('\n📨 Enviando email de teste...')

    await sendCouponEmail({
      to: 'contatoeutenhosonhos@gmail.com',
      couponCode: 'HYLIYAS9',
      couponValue: 1, // R$ 0,01 em centavos
      customerName: 'Orlando Estrela'
    })

    console.log('✅ Email enviado com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    
    if (error.code) {
      console.error('   Código:', error.code)
    }
    if (error.message) {
      console.error('   Mensagem:', error.message)
    }
    if (error.response) {
      console.error('   Response:', error.response)
    }
  }
}

testCouponEmail()