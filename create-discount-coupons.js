const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDiscountCoupons() {
  try {
    console.log('Criando cupons de desconto...');
    
    // Cupom de 25% de desconto
    const coupon25 = await prisma.discountCoupon.create({
      data: {
        type: 'PERMANENT_25',
        discount_percent: 25,
        is_active: true,
        sale_price_cents: 500 // R$ 5,00
      }
    });
    
    console.log('Cupom de 25% criado:', coupon25);
    
    // Cupom de 50% de desconto
    const coupon50 = await prisma.discountCoupon.create({
      data: {
        type: 'SPECIAL_50',
        discount_percent: 50,
        is_active: true,
        sale_price_cents: 1000 // R$ 10,00
      }
    });
    
    console.log('Cupom de 50% criado:', coupon50);
    
    console.log('Cupons de desconto criados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar cupons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDiscountCoupons();