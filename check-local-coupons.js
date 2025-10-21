const { PrismaClient } = require('@prisma/client');

// Usar banco local para desenvolvimento
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function checkLocalCoupons() {
  try {
    console.log('🔍 VERIFICANDO CUPONS NO BANCO LOCAL...');
    
    // Buscar cupons criados na última hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const coupons = await prisma.coupon.findMany({
      where: {
        created_at: {
          gte: oneHourAgo
        }
      },
      include: {
        payment: true,
        user: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`\n📋 CUPONS CRIADOS NA ÚLTIMA HORA (${coupons.length}):\n`);

    coupons.forEach((coupon, index) => {
      console.log(`${index + 1}. 🎫 CUPOM: ${coupon.code}`);
      console.log(`   ⏰ Criado: ${coupon.created_at.toLocaleString('pt-BR')}`);
      console.log(`   💰 Valor: R$ ${coupon.value || 'N/A'}`);
      console.log(`   📊 Status: ${coupon.status}`);
      
      if (coupon.user) {
        console.log(`   👤 Comprador: ${coupon.user.name} (${coupon.user.email})`);
      } else {
        console.log(`   ❌ SEM COMPRADOR ASSOCIADO!`);
      }
      
      if (coupon.payment) {
        console.log(`   💳 Pagamento MP: ${coupon.payment.mp_payment_id}`);
        console.log(`   💵 Valor Pago: R$ ${(coupon.payment.amount_cents / 100).toFixed(2)}`);
        console.log(`   🔄 Status Pagamento: ${coupon.payment.status}`);
      }
      console.log('');
    });

    // Verificar pagamentos recentes também
    const payments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: oneHourAgo
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`💳 VERIFICANDO PAGAMENTOS RECENTES (${payments.length}):\n`);

    payments.forEach((payment, index) => {
      console.log(`${index + 1}. 💳 Pagamento MP: ${payment.mp_payment_id}`);
      console.log(`   ⏰ Criado: ${payment.created_at.toLocaleString('pt-BR')}`);
      console.log(`   💵 Valor: R$ ${(payment.amount_cents / 100).toFixed(2)}`);
      console.log(`   🔄 Status: ${payment.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocalCoupons();