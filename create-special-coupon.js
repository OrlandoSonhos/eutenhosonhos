const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSpecialCoupon() {
  try {
    console.log('Criando cupom especial com datas...');
    
    // Criar um cupom especial de 50% com datas
    const coupon = await prisma.discountCoupon.create({
      data: {
        type: 'SPECIAL_50',
        discount_percent: 50,
        is_active: true,
        sale_price_cents: 1000, // R$ 10,00
        valid_from: new Date('2024-10-24T02:00:00.000Z'),
        valid_until: new Date('2024-10-24T05:51:00.000Z')
      }
    });
    
    console.log('Cupom especial criado:', coupon);
    
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSpecialCoupon();