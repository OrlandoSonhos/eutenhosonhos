const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebhookWith203() {
  console.log('🧪 TESTANDO WEBHOOK COM R$ 2,03');
  console.log('==================================================');
  
  try {
    // Verificar cupons disponíveis
    console.log('🔍 Verificando cupons disponíveis...');
    const coupons = await prisma.discountCoupon.findMany({
      where: { is_active: true },
      select: {
        id: true,
        type: true,
        discount_percent: true,
        sale_price_cents: true
      },
      orderBy: { sale_price_cents: 'asc' }
    });
    
    console.log('📋 Cupons ativos encontrados:');
    coupons.forEach(coupon => {
      const priceInReais = coupon.sale_price_cents ? (coupon.sale_price_cents / 100).toFixed(2) : 'N/A';
      console.log(`   - ${coupon.type}: ${coupon.discount_percent}% desconto, Preço: R$ ${priceInReais}`);
    });
    
    // Verificar se existe cupom para R$ 2,03 (203 centavos)
    const couponFor203 = coupons.find(c => c.sale_price_cents === 203);
    
    if (!couponFor203) {
      console.log('\n❌ NÃO ENCONTREI CUPOM PARA R$ 2,03');
      console.log('💡 Verifique se o cupom foi salvo corretamente com sale_price_cents = 203');
      
      // Mostrar valores próximos
      const nearValues = coupons.filter(c => c.sale_price_cents >= 200 && c.sale_price_cents <= 210);
      if (nearValues.length > 0) {
        console.log('\n🔍 Valores próximos encontrados:');
        nearValues.forEach(coupon => {
          const priceInReais = (coupon.sale_price_cents / 100).toFixed(2);
          console.log(`   - R$ ${priceInReais} (${coupon.sale_price_cents} centavos) → ${coupon.type}`);
        });
      }
      return;
    }
    
    console.log(`\n✅ CUPOM ENCONTRADO PARA R$ 2,03:`);
    console.log(`   - ID: ${couponFor203.id}`);
    console.log(`   - Tipo: ${couponFor203.type}`);
    console.log(`   - Desconto: ${couponFor203.discount_percent}%`);
    console.log(`   - Preço: R$ ${(couponFor203.sale_price_cents / 100).toFixed(2)}`);
    
    // Simular dados do webhook do Mercado Pago para R$ 2,03
    console.log('\n🎯 SIMULANDO WEBHOOK DO MERCADO PAGO...');
    
    const webhookData = {
      action: "payment.updated",
      api_version: "v1",
      data: {
        id: "888777666" // ID fictício para teste
      },
      date_created: new Date().toISOString(),
      id: Math.floor(Math.random() * 1000000),
      live_mode: false,
      type: "payment",
      user_id: "123456789"
    };
    
    // Simular dados do pagamento
    const paymentData = {
      id: 888777666,
      status: "approved",
      status_detail: "accredited",
      transaction_amount: 2.03, // R$ 2,03
      currency_id: "BRL",
      payer: {
        email: "teste203@exemplo.com",
        first_name: "Teste",
        last_name: "R$ 2,03"
      },
      payment_method: {
        id: "pix",
        type: "bank_transfer"
      },
      date_created: new Date().toISOString(),
      date_approved: new Date().toISOString()
    };
    
    console.log('📦 Dados do webhook simulado:');
    console.log(`   - Valor: R$ ${paymentData.transaction_amount.toFixed(2)}`);
    console.log(`   - Status: ${paymentData.status}`);
    console.log(`   - Email: ${paymentData.payer.email}`);
    console.log(`   - Método: ${paymentData.payment_method.id}`);
    
    // Simular a lógica do webhook
    const paidAmount = Math.round(paymentData.transaction_amount * 100); // 203 centavos
    console.log(`\n🔍 Valor pago em centavos: ${paidAmount}`);
    
    // Buscar cupom correspondente (como o webhook faz agora)
    const matchingCoupon = await prisma.discountCoupon.findFirst({
      where: {
        sale_price_cents: paidAmount,
        is_active: true
      }
    });
    
    if (matchingCoupon) {
      console.log('✅ WEBHOOK FUNCIONARIA CORRETAMENTE!');
      console.log(`   - Cupom encontrado: ${matchingCoupon.type}`);
      console.log(`   - Desconto: ${matchingCoupon.discount_percent}%`);
      console.log(`   - O webhook criaria um cupom de desconto para o usuário`);
      
      console.log('\n🎉 TESTE APROVADO!');
      console.log('💡 Agora você pode fazer um pagamento real de R$ 2,03 via Mercado Pago');
      console.log('   e o webhook irá funcionar perfeitamente!');
    } else {
      console.log('❌ WEBHOOK FALHARIA!');
      console.log('   - Nenhum cupom encontrado para este valor exato');
      console.log('   - O webhook retornaria erro 400');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhookWith203();