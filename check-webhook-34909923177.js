const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkWebhookProcessing() {
  try {
    console.log('🔍 VERIFICANDO PROCESSAMENTO DO WEBHOOK 34909923177...\n');
    
    // Buscar todos os cupons criados nos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentCoupons = await prisma.coupon.findMany({
      where: {
        created_at: {
          gte: thirtyMinutesAgo
        }
      },
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

    console.log(`📊 CUPONS CRIADOS NOS ÚLTIMOS 30 MINUTOS: ${recentCoupons.length}\n`);

    if (recentCoupons.length > 0) {
      recentCoupons.forEach((coupon, index) => {
        console.log(`${index + 1}. 🎫 Código: ${coupon.code}`);
        console.log(`   💰 Valor: R$ ${(coupon.face_value_cents / 100).toFixed(2)}`);
        console.log(`   📅 Criado: ${coupon.created_at.toLocaleString('pt-BR')}`);
        console.log(`   👤 Buyer ID: ${coupon.buyer_id}`);
        if (coupon.buyer) {
          console.log(`   📧 E-mail: ${coupon.buyer.email}`);
        }
        console.log(`   🔗 Status: ${coupon.status}\n`);
      });
    } else {
      console.log('❌ Nenhum cupom criado nos últimos 30 minutos');
    }

    // Verificar também os últimos 5 cupons independente da data
    console.log('\n📋 ÚLTIMOS 5 CUPONS (independente da data):');
    const lastFiveCoupons = await prisma.coupon.findMany({
      take: 5,
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

    lastFiveCoupons.forEach((coupon, index) => {
      console.log(`${index + 1}. 🎫 ${coupon.code} - R$ ${(coupon.face_value_cents / 100).toFixed(2)} - ${coupon.created_at.toLocaleString('pt-BR')}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWebhookProcessing();