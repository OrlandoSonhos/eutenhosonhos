const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDiscountCouponPurchasesOrderId() {
  try {
    console.log('🔧 INICIANDO CORREÇÃO DA TABELA discount_coupon_purchases');
    console.log('='.repeat(60));
    
    // Verificar se a coluna order_id já existe
    console.log('🔍 Verificando estrutura atual da tabela...');
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupon_purchases' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Estrutura atual da tabela discount_coupon_purchases:');
    tableInfo.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar se order_id já existe
    const hasOrderId = tableInfo.some(column => column.column_name === 'order_id');
    
    if (hasOrderId) {
      console.log('✅ A coluna order_id já existe na tabela!');
      console.log('   O problema pode estar em outro lugar...');
      
      // Verificar se há registros na tabela
      const count = await prisma.discountCouponPurchase.count();
      console.log(`📊 Total de registros na tabela: ${count}`);
      
      // Testar uma query simples
      try {
        const testQuery = await prisma.discountCouponPurchase.findFirst({
          select: {
            id: true,
            order_id: true,
            code: true
          }
        });
        console.log('✅ Query de teste executada com sucesso!');
        if (testQuery) {
          console.log(`   Exemplo: ID=${testQuery.id}, order_id=${testQuery.order_id}, code=${testQuery.code}`);
        }
      } catch (queryError) {
        console.error('❌ Erro na query de teste:', queryError.message);
      }
      
    } else {
      console.log('❌ A coluna order_id NÃO existe na tabela!');
      console.log('🔧 Adicionando coluna order_id...');
      
      try {
        // Adicionar a coluna order_id
        await prisma.$executeRaw`
          ALTER TABLE discount_coupon_purchases 
          ADD COLUMN order_id VARCHAR(255)
        `;
        
        console.log('✅ Coluna order_id adicionada com sucesso!');
        
        // Adicionar foreign key constraint
        console.log('🔗 Adicionando foreign key constraint...');
        await prisma.$executeRaw`
          ALTER TABLE discount_coupon_purchases 
          ADD CONSTRAINT discount_coupon_purchases_order_id_fkey 
          FOREIGN KEY (order_id) REFERENCES orders(id)
        `;
        
        console.log('✅ Foreign key constraint adicionada com sucesso!');
        
      } catch (alterError) {
        console.error('❌ Erro ao alterar tabela:', alterError.message);
        
        // Se o erro for que a constraint já existe, ignorar
        if (alterError.message.includes('already exists')) {
          console.log('ℹ️  Constraint já existe, continuando...');
        } else {
          throw alterError;
        }
      }
    }
    
    // Verificar estrutura final
    console.log('\n🔍 Verificando estrutura final da tabela...');
    const finalTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupon_purchases' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Estrutura final da tabela discount_coupon_purchases:');
    finalTableInfo.forEach((column, index) => {
      const isNew = column.column_name === 'order_id';
      const marker = isNew ? '🆕' : '   ';
      console.log(`${marker} ${index + 1}. ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🎯 O webhook do Mercado Pago agora deve funcionar corretamente.');
    
  } catch (error) {
    console.error('❌ ERRO DURANTE A CORREÇÃO:', error);
    console.error('   Tipo:', error.constructor.name);
    console.error('   Mensagem:', error.message);
    
    if (error.code) {
      console.error('   Código:', error.code);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixDiscountCouponPurchasesOrderId();
}

module.exports = { fixDiscountCouponPurchasesOrderId };