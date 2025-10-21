require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function sendCouponToVinicius() {
  const viniciusEmail = 'vini_deiro@icloud.com';
  const couponCode = 'LR8OVFBV';
  
  console.log('🎫 ENVIANDO CUPOM PARA VINICIUS');
  console.log('E-mail:', viniciusEmail);
  console.log('Cupom:', couponCode);
  
  try {
    // 1. Buscar usuário Vinicius
    console.log('\n👤 Buscando usuário Vinicius...');
    const user = await prisma.user.findUnique({
      where: { email: viniciusEmail }
    });
    
    if (!user) {
      throw new Error('Usuário Vinicius não encontrado');
    }
    
    console.log('✅ Usuário encontrado:', user.name);
    
    // 2. Buscar cupom
    console.log('\n🎫 Buscando cupom...');
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode }
    });
    
    if (!coupon) {
      throw new Error(`Cupom ${couponCode} não encontrado`);
    }
    
    console.log('✅ Cupom encontrado:');
    console.log('   Código:', coupon.code);
    console.log('   Valor:', `R$ ${(coupon.face_value_cents / 100).toFixed(2)}`);
    console.log('   Status:', coupon.status);
    console.log('   Comprador atual:', coupon.buyer_id || 'NÃO ASSOCIADO');
    
    // 3. Associar cupom ao usuário Vinicius
    console.log('\n🔗 Associando cupom ao usuário...');
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        buyer_id: user.id,
        updated_at: new Date()
      }
    });
    
    console.log('✅ Cupom associado ao usuário Vinicius!');
    
    // 4. Importar e enviar e-mail
    console.log('\n📧 Enviando e-mail...');
    const { sendCouponEmail } = require('./src/lib/email');
    
    await sendCouponEmail({
      to: viniciusEmail,
      couponCode: coupon.code,
      couponValue: coupon.face_value_cents,
      customerName: user.name
    });
    
    console.log('✅ E-MAIL ENVIADO COM SUCESSO!');
    
    // 5. Verificar resultado final
    console.log('\n🎯 VERIFICAÇÃO FINAL:');
    const updatedCoupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
      include: {
        buyer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('✅ CUPOM ATUALIZADO:');
    console.log('   Código:', updatedCoupon.code);
    console.log('   Valor:', `R$ ${(updatedCoupon.face_value_cents / 100).toFixed(2)}`);
    console.log('   Comprador:', updatedCoupon.buyer?.name);
    console.log('   E-mail:', updatedCoupon.buyer?.email);
    console.log('   Status:', updatedCoupon.status);
    console.log('   Expira em:', updatedCoupon.expires_at.toLocaleDateString('pt-BR'));
    
    console.log('\n🎉 SUCESSO TOTAL!');
    console.log('   ✅ Cupom associado ao Vinicius');
    console.log('   ✅ E-mail enviado');
    console.log('   ✅ Problema resolvido');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.message.includes('SENDGRID') || error.message.includes('SMTP')) {
      console.log('\n🔧 PROBLEMA COM E-MAIL:');
      console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
      console.log('   SMTP_USER:', process.env.SMTP_USER || 'NÃO CONFIGURADO');
      console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
      
      console.log('\n💡 MESMO ASSIM, O CUPOM FOI ASSOCIADO AO SEU USUÁRIO!');
      console.log('   Você pode acessar em: /meus-cupons');
    }
  } finally {
    await prisma.$disconnect();
  }
}

sendCouponToVinicius();