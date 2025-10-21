const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkLatestCoupon() {
  try {
    console.log('🔍 VERIFICANDO CUPOM MAIS RECENTE...\n');
    
    // Buscar o cupom mais recente
    const latestCoupon = await prisma.coupon.findFirst({
      orderBy: {
        created_at: 'desc'
      },
      include: {
        buyer: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (latestCoupon) {
      console.log('✅ CUPOM MAIS RECENTE ENCONTRADO:');
      console.log(`🎫 Código: ${latestCoupon.code}`);
      console.log(`💰 Valor: R$ ${(latestCoupon.face_value_cents / 100).toFixed(2)}`);
      console.log(`📅 Criado em: ${latestCoupon.created_at.toLocaleString('pt-BR')}`);
      console.log(`🔗 Status: ${latestCoupon.status}`);
      console.log(`👤 Buyer ID: ${latestCoupon.buyer_id}`);
      
      if (latestCoupon.buyer) {
        console.log(`📧 E-mail: ${latestCoupon.buyer.email}`);
        console.log(`👤 Nome: ${latestCoupon.buyer.name}`);
      }
      
      // Verificar se foi criado nos últimos 10 minutos
      const now = new Date();
      const diffMinutes = (now - latestCoupon.created_at) / (1000 * 60);
      
      if (diffMinutes <= 10) {
        console.log(`\n🎉 CUPOM CRIADO HÁ ${Math.round(diffMinutes)} MINUTOS - MUITO RECENTE!`);
      }
    } else {
      console.log('❌ Nenhum cupom encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestCoupon();