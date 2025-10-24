const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebhookWith2Reais() {
  console.log('🧪 TESTANDO WEBHOOK COM R$ 2,00');
  console.log('==================================================');
  
  try {
    // Verificar se existe cupom com valor de R$ 2,00 (200 centavos)
    console.log('🔍 Verificando cupons disponíveis...');
    const coupons = await prisma.discountCoupon.findMany({
      where: { is_active: true },
      select: {
        id: true,
        type: true,
        discount_percent: true,
        sale_price_cents: true
      }
    });
    
    console.log('📋 Cupons ativos encontrados:');
    coupons.forEach(coupon => {
      const priceInReais = coupon.sale_price_cents ? (coupon.sale_price_cents / 100).toFixed(2) : 'N/A';
      console.log(`   - ${coupon.type}: ${coupon.discount_percent}% desconto, Preço: R$ ${priceInReais}`);
    });
    
    // Verificar se existe cupom para R$ 2,00
    const couponFor2Reais = coupons.find(c => c.sale_price_cents === 200);
    
    if (!couponFor2Reais) {
      console.log('\n❌ NÃO EXISTE CUPOM CADASTRADO PARA R$ 2,00');
      console.log('💡 Para testar com R$ 2,00, você precisa:');
      console.log('   1. Criar um cupom com sale_price_cents = 200');
      console.log('   2. Ou testar com um dos valores existentes');
      
      console.log('\n🔧 Vou criar um cupom temporário para R$ 2,00...');
      
      // Criar cupom temporário para teste
      const tempCoupon = await prisma.discountCoupon.create({
        data: {
          type: 'PERMANENT_25', // Usando tipo existente
          discount_percent: 25,
          sale_price_cents: 200, // R$ 2,00
          is_active: true
        }
      });
      
      console.log(`✅ Cupom temporário criado: ${tempCoupon.id}`);
      console.log(`   - Tipo: ${tempCoupon.type}`);
      console.log(`   - Desconto: ${tempCoupon.discount_percent}%`);
      console.log(`   - Preço: R$ ${(tempCoupon.sale_price_cents / 100).toFixed(2)}`);
      
    } else {
      console.log(`\n✅ CUPOM ENCONTRADO PARA R$ 2,00:`);
      console.log(`   - ID: ${couponFor2Reais.id}`);
      console.log(`   - Tipo: ${couponFor2Reais.type}`);
      console.log(`   - Desconto: ${couponFor2Reais.discount_percent}%`);
    }
    
    console.log('\n🎯 AGORA O WEBHOOK DEVE ACEITAR PAGAMENTOS DE R$ 2,00');
    console.log('💡 Para testar:');
    console.log('   1. Faça um pagamento de R$ 2,00 via Mercado Pago');
    console.log('   2. O webhook irá buscar automaticamente o cupom com sale_price_cents = 200');
    console.log('   3. Se encontrar, criará o cupom; se não encontrar, retornará erro');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhookWith2Reais();