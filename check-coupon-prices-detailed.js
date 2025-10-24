const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCouponPricesDetailed() {
  console.log('🔍 VERIFICAÇÃO DETALHADA DOS PREÇOS DOS CUPONS');
  console.log('==================================================');
  
  try {
    // Buscar TODOS os cupons (ativos e inativos)
    const allCoupons = await prisma.discountCoupon.findMany({
      select: {
        id: true,
        type: true,
        discount_percent: true,
        sale_price_cents: true,
        is_active: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`📊 Total de cupons encontrados: ${allCoupons.length}`);
    console.log('');
    
    allCoupons.forEach((coupon, index) => {
      const priceInReais = coupon.sale_price_cents ? (coupon.sale_price_cents / 100).toFixed(2) : 'NÃO DEFINIDO';
      const status = coupon.is_active ? '✅ ATIVO' : '❌ INATIVO';
      
      console.log(`${index + 1}. 🎫 CUPOM: ${coupon.type}`);
      console.log(`   📊 Desconto: ${coupon.discount_percent}%`);
      console.log(`   💰 Preço: R$ ${priceInReais} (${coupon.sale_price_cents || 'null'} centavos)`);
      console.log(`   📊 Status: ${status}`);
      console.log(`   📅 Criado: ${coupon.created_at.toLocaleString('pt-BR')}`);
      console.log(`   📅 Atualizado: ${coupon.updated_at.toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // Verificar especificamente por R$ 1,00
    const couponFor1Real = allCoupons.find(c => c.sale_price_cents === 100);
    
    if (couponFor1Real) {
      console.log('✅ CUPOM DE R$ 1,00 ENCONTRADO!');
      console.log(`   - Tipo: ${couponFor1Real.type}`);
      console.log(`   - Desconto: ${couponFor1Real.discount_percent}%`);
      console.log(`   - Ativo: ${couponFor1Real.is_active ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ CUPOM DE R$ 1,00 NÃO ENCONTRADO');
      console.log('💡 Para criar um cupom de R$ 1,00, você pode:');
      console.log('   1. Atualizar um cupom existente');
      console.log('   2. Ou criar um novo cupom');
    }
    
    // Mostrar quais valores o webhook aceita atualmente
    console.log('\n🎯 VALORES QUE O WEBHOOK ACEITA ATUALMENTE:');
    const activeCoupons = allCoupons.filter(c => c.is_active && c.sale_price_cents);
    
    if (activeCoupons.length === 0) {
      console.log('❌ NENHUM CUPOM ATIVO COM PREÇO DEFINIDO!');
    } else {
      activeCoupons.forEach(coupon => {
        const priceInReais = (coupon.sale_price_cents / 100).toFixed(2);
        console.log(`   💰 R$ ${priceInReais} → ${coupon.type} (${coupon.discount_percent}% desconto)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCouponPricesDetailed();