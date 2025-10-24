const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDiscountCouponPrices() {
  try {
    console.log('🔧 ATUALIZANDO PREÇOS DOS CUPONS DE DESCONTO');
    console.log('='.repeat(50));
    
    // Atualizar cupom de 25%
    const permanent25Result = await prisma.discountCoupon.updateMany({
      where: {
        type: 'PERMANENT_25'
      },
      data: {
        sale_price_cents: 500 // R$ 5,00
      }
    });
    
    console.log('✅ Cupom PERMANENT_25 atualizado:');
    console.log(`   Registros atualizados: ${permanent25Result.count}`);
    
    // Atualizar cupom de 50%
    const special50Result = await prisma.discountCoupon.updateMany({
      where: {
        type: 'SPECIAL_50'
      },
      data: {
        sale_price_cents: 1000 // R$ 10,00
      }
    });
    
    console.log('✅ Cupom SPECIAL_50 atualizado:');
    console.log(`   Registros atualizados: ${special50Result.count}`);
    
    console.log('\n🎉 Preços atualizados com sucesso!');
    console.log('   Agora o webhook pode mapear valores pagos para cupons automaticamente');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDiscountCouponPrices();