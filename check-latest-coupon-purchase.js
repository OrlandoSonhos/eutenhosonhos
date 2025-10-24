const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestCouponPurchase() {
  try {
    console.log('🔍 VERIFICANDO ÚLTIMO CUPOM CRIADO');
    console.log('='.repeat(50));
    
    // Buscar o último cupom criado
    const latestCoupon = await prisma.discountCouponPurchase.findFirst({
      orderBy: {
        created_at: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discount_coupon: {
          select: {
            id: true,
            type: true,
            discount_percent: true
          }
        }
      }
    });
    
    if (latestCoupon) {
      console.log('✅ ÚLTIMO CUPOM ENCONTRADO:');
      console.log(`   ID: ${latestCoupon.id}`);
      console.log(`   Código: ${latestCoupon.code}`);
      console.log(`   Comprador: ${latestCoupon.user.name} (${latestCoupon.user.email})`);
      console.log(`   Tipo: ${latestCoupon.discount_coupon.type}`);
      console.log(`   Desconto: ${latestCoupon.discount_coupon.discount_percent}%`);
      console.log(`   Usado: ${latestCoupon.is_used ? 'Sim' : 'Não'}`);
      console.log(`   Expira em: ${latestCoupon.expires_at}`);
      console.log(`   Criado em: ${latestCoupon.created_at}`);
      
      if (latestCoupon.used_at) {
        console.log(`   Usado em: ${latestCoupon.used_at}`);
      }
    } else {
      console.log('❌ Nenhum cupom encontrado');
    }
    
    // Contar total de cupons
    const totalCoupons = await prisma.discountCouponPurchase.count();
    console.log(`\n📊 Total de cupons no banco: ${totalCoupons}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestCouponPurchase();