const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdditionalDiscountCoupons() {
  try {
    console.log('🎫 CRIANDO CUPONS ADICIONAIS PARA TESTES');
    console.log('='.repeat(50));
    
    // Primeiro, vamos verificar se precisamos adicionar novos tipos ao enum
    console.log('⚠️  NOTA: Para adicionar novos tipos, você precisará:');
    console.log('   1. Atualizar o enum DiscountCouponType no schema.prisma');
    console.log('   2. Executar uma migração do Prisma');
    console.log('   3. Regenerar o cliente Prisma');
    console.log('');
    
    // Por enquanto, vamos criar cupons usando os tipos existentes mas com preços diferentes
    console.log('🔧 Atualizando cupons existentes para aceitar diferentes valores...');
    
    // Criar um cupom de R$ 1,00 (usando PERMANENT_25 mas mudando o preço)
    const coupon1Real = await prisma.discountCoupon.create({
      data: {
        type: 'PERMANENT_25',
        discount_percent: 25,
        sale_price_cents: 100, // R$ 1,00
        is_active: true
      }
    });
    
    console.log('✅ Cupom de R$ 1,00 criado:');
    console.log(`   Tipo: ${coupon1Real.type}`);
    console.log(`   Desconto: ${coupon1Real.discount_percent}%`);
    console.log(`   Preço: R$ ${(coupon1Real.sale_price_cents / 100).toFixed(2)}`);
    
    // Criar um cupom de R$ 50,00
    const coupon50Reais = await prisma.discountCoupon.create({
      data: {
        type: 'SPECIAL_50',
        discount_percent: 50,
        sale_price_cents: 5000, // R$ 50,00
        is_active: true
      }
    });
    
    console.log('✅ Cupom de R$ 50,00 criado:');
    console.log(`   Tipo: ${coupon50Reais.type}`);
    console.log(`   Desconto: ${coupon50Reais.discount_percent}%`);
    console.log(`   Preço: R$ ${(coupon50Reais.sale_price_cents / 100).toFixed(2)}`);
    
    console.log('\n🎉 Cupons adicionais criados com sucesso!');
    console.log('   Agora o webhook aceita: R$ 1,00, R$ 5,00, R$ 10,00 e R$ 50,00');
    
    // Listar todos os cupons disponíveis
    console.log('\n📋 TODOS OS CUPONS DISPONÍVEIS:');
    const allCoupons = await prisma.discountCoupon.findMany({
      where: { is_active: true },
      orderBy: { sale_price_cents: 'asc' }
    });
    
    allCoupons.forEach((coupon, index) => {
      console.log(`${index + 1}. ${coupon.type} - ${coupon.discount_percent}% por R$ ${(coupon.sale_price_cents / 100).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdditionalDiscountCoupons();