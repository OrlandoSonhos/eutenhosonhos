const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDiscountCoupons() {
  try {
    const coupons = await prisma.discountCoupon.findMany({
      orderBy: { discount_percent: 'asc' }
    });
    
    console.log('=== CUPONS DE DESCONTO NO BANCO ===');
    console.log('Total:', coupons.length);
    console.log('');
    
    coupons.forEach((coupon, index) => {
      console.log(`${index + 1}. ID: ${coupon.id}`);
      console.log(`   Tipo: ${coupon.type}`);
      console.log(`   Desconto: ${coupon.discount_percent}%`);
      console.log(`   Preço de venda: R$ ${(coupon.sale_price_cents || 0) / 100}`);
      console.log(`   Ativo: ${coupon.is_active ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${coupon.created_at}`);
      console.log('');
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiscountCoupons();