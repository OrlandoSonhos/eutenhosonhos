const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndCleanLongCodes() {
  try {
    console.log('🔍 VERIFICANDO CUPONS COM CÓDIGOS LONGOS...');
    console.log('='.repeat(50));
    
    // Buscar todos os cupons comprados
    const allCoupons = await prisma.discountCouponPurchase.findMany({
      include: {
        discount_coupon: true,
        user: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`📋 Total de cupons encontrados: ${allCoupons.length}`);
    
    // Separar cupons por tamanho do código
    const shortCodes = allCoupons.filter(c => c.code.length <= 8);
    const longCodes = allCoupons.filter(c => c.code.length > 8);
    
    console.log(`\n✅ Cupons com código correto (≤8 chars): ${shortCodes.length}`);
    shortCodes.forEach(coupon => {
      console.log(`   - ${coupon.code} (${coupon.code.length} chars) - ${coupon.discount_coupon.discount_percent}% - ${coupon.user.email}`);
    });
    
    console.log(`\n⚠️  Cupons com código longo (>8 chars): ${longCodes.length}`);
    longCodes.forEach(coupon => {
      console.log(`   - ${coupon.code} (${coupon.code.length} chars) - ${coupon.discount_coupon.discount_percent}% - ${coupon.user.email}`);
    });
    
    if (longCodes.length > 0) {
      console.log('\n🧹 REMOVENDO CUPONS COM CÓDIGOS LONGOS...');
      
      for (const coupon of longCodes) {
        console.log(`   Removendo: ${coupon.code}`);
        await prisma.discountCouponPurchase.delete({
          where: { id: coupon.id }
        });
      }
      
      console.log(`✅ ${longCodes.length} cupons com códigos longos removidos!`);
    }
    
    console.log('\n📊 RESUMO FINAL:');
    const finalCount = await prisma.discountCouponPurchase.count();
    console.log(`   Total de cupons restantes: ${finalCount}`);
    
    // Listar cupons finais
    const finalCoupons = await prisma.discountCouponPurchase.findMany({
      include: {
        discount_coupon: true,
        user: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log('\n🎫 CUPONS VÁLIDOS RESTANTES:');
    finalCoupons.forEach((coupon, index) => {
      const status = coupon.is_used ? '✅ USADO' : '🎯 DISPONÍVEL';
      console.log(`${index + 1}. ${coupon.code} - ${coupon.discount_coupon.discount_percent}% - ${status} - ${coupon.user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCleanLongCodes();