const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebhookAfterFix() {
  try {
    console.log('🧪 TESTANDO WEBHOOK APÓS CORREÇÃO');
    console.log('='.repeat(50));
    
    // Simular dados do webhook que estava falhando
    const testUserId = 'cmgl6yb980000l404zqlm7rfr';
    const testExternalReference = `cupom-${Date.now()}-usuário-${testUserId}`;
    
    console.log('📋 Dados do teste:');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   External Reference: ${testExternalReference}`);
    
    // 1. Verificar se o usuário existe
    console.log('\n🔍 1. Verificando usuário...');
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { id: true, name: true, email: true }
    });
    
    if (user) {
      console.log('✅ Usuário encontrado:', user.name, `(${user.email})`);
    } else {
      console.log('❌ Usuário não encontrado - criando usuário de teste...');
      // Não vamos criar usuário real, apenas simular
      console.log('ℹ️  Para teste real, use um usuário existente');
      return;
    }
    
    // 2. Verificar cupons de desconto disponíveis
    console.log('\n🔍 2. Verificando cupons de desconto disponíveis...');
    const discountCoupons = await prisma.discountCoupon.findMany({
      where: { is_active: true },
      select: {
        id: true,
        type: true,
        discount_percent: true,
        sale_price_cents: true
      }
    });
    
    console.log(`📊 Cupons disponíveis: ${discountCoupons.length}`);
    discountCoupons.forEach((coupon, index) => {
      const price = coupon.sale_price_cents ? `R$ ${(coupon.sale_price_cents / 100).toFixed(2)}` : 'N/A';
      console.log(`   ${index + 1}. ${coupon.type}: ${coupon.discount_percent}% por ${price}`);
    });
    
    if (discountCoupons.length === 0) {
      console.log('❌ Nenhum cupom de desconto ativo encontrado');
      return;
    }
    
    // 3. Testar query que estava falhando
    console.log('\n🔍 3. Testando query que estava falhando...');
    
    try {
      // Esta é a query que estava causando o erro
      const testQuery = await prisma.discountCouponPurchase.findFirst({
        where: { 
          code: 'TEST_CODE_THAT_DOES_NOT_EXIST' 
        },
        select: {
          id: true,
          code: true,
          order_id: true, // Esta linha estava causando o erro
          buyer_id: true
        }
      });
      
      console.log('✅ Query executada com sucesso! (resultado: null, como esperado)');
      
    } catch (queryError) {
      console.error('❌ Query ainda está falhando:', queryError.message);
      return;
    }
    
    // 4. Testar criação de cupom (simulação)
    console.log('\n🔍 4. Testando criação de cupom...');
    
    const testCouponCode = `TEST${Date.now()}`;
    const firstCoupon = discountCoupons[0];
    
    try {
      // Verificar se código já existe (teste da lógica do webhook)
      const existingCoupon = await prisma.discountCouponPurchase.findFirst({
        where: { code: testCouponCode }
      });
      
      console.log('✅ Verificação de código existente funcionando');
      
      // Simular criação (não vamos criar de verdade para não poluir o banco)
      console.log(`ℹ️  Simulação: Criaria cupom ${testCouponCode} para usuário ${user.name}`);
      console.log(`   Tipo: ${firstCoupon.type} (${firstCoupon.discount_percent}%)`);
      
    } catch (createError) {
      console.error('❌ Erro na simulação de criação:', createError.message);
      return;
    }
    
    // 5. Verificar estrutura da tabela
    console.log('\n🔍 5. Verificando estrutura final da tabela...');
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupon_purchases' 
      AND column_name IN ('id', 'order_id', 'code', 'buyer_id')
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Colunas principais:');
    tableInfo.forEach(column => {
      const marker = column.column_name === 'order_id' ? '🆕' : '   ';
      console.log(`${marker} ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🎯 O webhook deve estar funcionando corretamente agora.');
    console.log('💡 Para testar completamente, faça um pagamento real de cupom.');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('   Tipo:', error.constructor.name);
    console.error('   Mensagem:', error.message);
    
    if (error.code) {
      console.error('   Código:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testWebhookAfterFix();
}

module.exports = { testWebhookAfterFix };