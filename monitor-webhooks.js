const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorWebhooks() {
  console.log('🔍 MONITORANDO WEBHOOKS E CUPONS EM TEMPO REAL...');
  console.log('⏰ Iniciado em:', new Date().toLocaleString('pt-BR'));
  console.log('👤 Monitorando usuário: vini_deiro@icloud.com');
  console.log('📝 Pressione Ctrl+C para parar\n');

  // Buscar estado inicial
  const user = await prisma.user.findUnique({
    where: { email: 'vini_deiro@icloud.com' },
    include: { coupons: true }
  });

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return;
  }

  let lastCouponCount = user.coupons.length;
  console.log(`📊 Estado inicial: ${lastCouponCount} cupons`);

  // Monitorar a cada 5 segundos
  setInterval(async () => {
    try {
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'vini_deiro@icloud.com' },
        include: { 
          coupons: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const currentCouponCount = updatedUser.coupons.length;
      
      if (currentCouponCount > lastCouponCount) {
        console.log(`\n🎉 NOVO CUPOM DETECTADO!`);
        console.log(`📊 Cupons: ${lastCouponCount} → ${currentCouponCount}`);
        
        // Mostrar os novos cupons
        const newCoupons = updatedUser.coupons.slice(0, currentCouponCount - lastCouponCount);
        newCoupons.forEach((coupon, index) => {
          console.log(`🎫 Novo cupom ${index + 1}: ${coupon.code} - R$ ${coupon.value.toFixed(2)}`);
          console.log(`   Criado: ${coupon.createdAt.toLocaleString('pt-BR')}`);
          console.log(`   Status: ${coupon.status}`);
        });
        
        lastCouponCount = currentCouponCount;
      } else {
        // Mostrar ponto para indicar que está monitorando
        process.stdout.write('.');
      }
    } catch (error) {
      console.error('\n❌ Erro ao monitorar:', error.message);
    }
  }, 5000);
}

monitorWebhooks().catch(console.error);