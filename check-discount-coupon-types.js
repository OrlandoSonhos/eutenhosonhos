const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDiscountCouponTypes() {
  try {
    console.log('🔍 VERIFICANDO TIPOS DE CUPONS DE DESCONTO DISPONÍVEIS');
    console.log('='.repeat(60));
    
    // Buscar todos os tipos de cupons de desconto
    const discountCoupons = await prisma.discountCoupon.findMany({
      orderBy: {
        discount_percent: 'asc'
      }
    });
    
    console.log(`📊 Total de tipos de cupons: ${discountCoupons.length}\n`);
    
    if (discountCoupons.length === 0) {
      console.log('❌ Nenhum tipo de cupom de desconto encontrado');
      console.log('   É necessário criar os tipos de cupons primeiro');
      return;
    }
    
    discountCoupons.forEach((coupon, index) => {
      console.log(`${index + 1}. 🎫 TIPO: ${coupon.type}`);
      console.log(`   📊 Desconto: ${coupon.discount_percent}%`);
      console.log(`   📝 Descrição: ${coupon.description}`);
      console.log(`   ✅ Ativo: ${coupon.is_active ? 'Sim' : 'Não'}`);
      console.log(`   📅 Criado: ${coupon.created_at.toLocaleDateString('pt-BR')}`);
      console.log('');
    });
    
    // Mostrar mapeamento atual do webhook
    console.log('🔧 MAPEAMENTO ATUAL DO WEBHOOK:');
    console.log('='.repeat(40));
    console.log('💰 R$ 5,00 (500 centavos) → Cupom 25% (PERMANENT_25)');
    console.log('💰 R$ 10,00 (1000 centavos) → Cupom 50% (SPECIAL_50)');
    console.log('');
    
    // Verificar se os tipos esperados existem
    const permanent25 = discountCoupons.find(c => c.type === 'PERMANENT_25');
    const special50 = discountCoupons.find(c => c.type === 'SPECIAL_50');
    
    console.log('✅ VERIFICAÇÃO DOS TIPOS ESPERADOS:');
    console.log(`   PERMANENT_25 (25%): ${permanent25 ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`   SPECIAL_50 (50%): ${special50 ? '✅ Existe' : '❌ Não existe'}`);
    
    if (!permanent25 || !special50) {
      console.log('\n⚠️  ATENÇÃO: Alguns tipos de cupons esperados não existem!');
      console.log('   O webhook pode falhar para alguns valores de pagamento.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiscountCouponTypes();