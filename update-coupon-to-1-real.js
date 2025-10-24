const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCouponTo1Real() {
  console.log('🔧 ATUALIZANDO CUPOM PARA R$ 1,00');
  console.log('==================================================');
  
  try {
    // Buscar o cupom PERMANENT_25 para atualizar
    const coupon = await prisma.discountCoupon.findFirst({
      where: { type: 'PERMANENT_25' }
    });
    
    if (!coupon) {
      console.log('❌ Cupom PERMANENT_25 não encontrado');
      return;
    }
    
    console.log('📋 Cupom atual:');
    console.log(`   - Tipo: ${coupon.type}`);
    console.log(`   - Desconto: ${coupon.discount_percent}%`);
    console.log(`   - Preço atual: R$ ${coupon.sale_price_cents ? (coupon.sale_price_cents / 100).toFixed(2) : 'N/A'}`);
    
    // Atualizar para R$ 1,00 (100 centavos)
    console.log('\n🔄 Atualizando preço para R$ 1,00...');
    
    const updatedCoupon = await prisma.discountCoupon.update({
      where: { id: coupon.id },
      data: {
        sale_price_cents: 100 // R$ 1,00
      }
    });
    
    console.log('✅ Cupom atualizado com sucesso!');
    console.log(`   - Tipo: ${updatedCoupon.type}`);
    console.log(`   - Desconto: ${updatedCoupon.discount_percent}%`);
    console.log(`   - Novo preço: R$ ${(updatedCoupon.sale_price_cents / 100).toFixed(2)}`);
    
    console.log('\n🎯 AGORA O WEBHOOK ACEITA:');
    console.log('   💰 R$ 1,00 → PERMANENT_25 (25% desconto)');
    console.log('   💰 R$ 10,00 → SPECIAL_50 (50% desconto)');
    
    console.log('\n🧪 TESTE PRONTO!');
    console.log('💡 Agora você pode fazer um pagamento de R$ 1,00 via Mercado Pago');
    console.log('   e o webhook irá criar um cupom de 25% de desconto automaticamente.');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCouponTo1Real();