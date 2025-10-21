require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function sendCouponEmailManually() {
  const paymentId = '130131909361';
  const couponCode = 'LR8OVFBV';
  
  console.log('📧 ENVIANDO E-MAIL DO CUPOM MANUALMENTE');
  console.log('Payment ID:', paymentId);
  console.log('Cupom:', couponCode);
  
  try {
    // 1. Buscar dados do pagamento no MP
    console.log('\n🔍 Buscando dados do pagamento...');
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const payment = await response.json();
    const payerEmail = payment.payer?.email;
    const payerName = payment.payer?.first_name || payment.payer?.last_name || 'Cliente';
    
    if (!payerEmail) {
      throw new Error('E-mail do pagador não encontrado');
    }
    
    console.log('✅ E-mail do pagador:', payerEmail);
    console.log('✅ Nome do pagador:', payerName);
    
    // 2. Buscar dados do cupom no banco
    console.log('\n🎫 Buscando dados do cupom...');
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode }
    });
    
    if (!coupon) {
      throw new Error(`Cupom ${couponCode} não encontrado no banco`);
    }
    
    console.log('✅ Cupom encontrado:');
    console.log('   Código:', coupon.code);
    console.log('   Valor:', `R$ ${(coupon.face_value_cents / 100).toFixed(2)}`);
    console.log('   Status:', coupon.status);
    console.log('   Expira em:', coupon.expires_at);
    
    // 3. Importar função de envio de e-mail
    const { sendCouponEmail } = require('./src/lib/email');
    
    // 4. Enviar e-mail
    console.log('\n📧 Enviando e-mail...');
    console.log('   Para:', payerEmail);
    console.log('   Código:', coupon.code);
    console.log('   Valor:', coupon.face_value_cents);
    console.log('   Nome:', payerName);
    
    await sendCouponEmail({
      to: payerEmail,
      couponCode: coupon.code,
      couponValue: coupon.face_value_cents,
      customerName: payerName
    });
    
    console.log('✅ E-MAIL ENVIADO COM SUCESSO!');
    console.log('\n📋 RESUMO:');
    console.log('   Pagamento:', paymentId);
    console.log('   Cupom:', couponCode);
    console.log('   Valor:', `R$ ${(coupon.face_value_cents / 100).toFixed(2)}`);
    console.log('   Destinatário:', payerEmail);
    console.log('   Nome:', payerName);
    
    // 5. Registrar o envio manual (opcional)
    console.log('\n📝 Registrando envio manual...');
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        updated_at: new Date()
      }
    });
    
    console.log('✅ Registro atualizado!');
    
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message);
    
    if (error.message.includes('SENDGRID') || error.message.includes('SMTP')) {
      console.log('\n🔧 VERIFICAR CONFIGURAÇÕES DE E-MAIL:');
      console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
      console.log('   SMTP_USER:', process.env.SMTP_USER || 'NÃO CONFIGURADO');
      console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
    }
    
    console.log('\n💡 ALTERNATIVAS:');
    console.log('   1. Verificar configurações de e-mail');
    console.log('   2. Enviar cupom manualmente via outro meio');
    console.log('   3. Contatar o cliente diretamente');
  } finally {
    await prisma.$disconnect();
  }
}

sendCouponEmailManually();