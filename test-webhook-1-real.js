const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebhookWith1Real() {
  console.log('🧪 TESTANDO WEBHOOK COM R$ 1,00');
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
    
    // Verificar se existe cupom para R$ 1,00 (100 centavos)
    const couponFor1Real = coupons.find(c => c.sale_price_cents === 100);
    
    if (!couponFor1Real) {
      console.log('\n❌ NÃO ENCONTREI CUPOM PARA R$ 1,00');
      console.log('💡 Verifique se o cupom foi salvo corretamente com sale_price_cents = 100');
      return;
    }
    
    console.log(`\n✅ CUPOM ENCONTRADO PARA R$ 1,00:`);
    console.log(`   - ID: ${couponFor1Real.id}`);
    console.log(`   - Tipo: ${couponFor1Real.type}`);
    console.log(`   - Desconto: ${couponFor1Real.discount_percent}%`);
    console.log(`   - Preço: R$ ${(couponFor1Real.sale_price_cents / 100).toFixed(2)}`);
    
    // Simular dados do webhook do Mercado Pago para R$ 1,00
    console.log('\n🎯 SIMULANDO WEBHOOK DO MERCADO PAGO...');
    
    const webhookData = {
      action: "payment.updated",
      api_version: "v1",
      data: {
        id: "999888777" // ID fictício para teste
      },
      date_created: new Date().toISOString(),
      id: Math.floor(Math.random() * 1000000),
      live_mode: false,
      type: "payment",
      user_id: "123456789"
    };
    
    // Simular dados do pagamento
    const paymentData = {
      id: 999888777,
      status: "approved",
      status_detail: "accredited",
      transaction_amount: 1.00, // R$ 1,00
      currency_id: "BRL",
      payer: {
        email: "teste@exemplo.com",
        first_name: "Teste",
        last_name: "Webhook"
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
    const paidAmount = Math.round(paymentData.transaction_amount * 100); // 100 centavos
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
    } else {
      console.log('❌ WEBHOOK FALHARIA!');
      console.log('   - Nenhum cupom encontrado para este valor');
      console.log('   - O webhook retornaria erro 400');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('💡 Para testar de verdade, faça um pagamento real de R$ 1,00 via Mercado Pago');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhookWith1Real();