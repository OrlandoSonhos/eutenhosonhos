const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA discount_coupon_purchases');
    console.log('='.repeat(60));
    
    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'discount_coupon_purchases'
      );
    `;
    
    console.log('📋 Tabela existe:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      // Verificar colunas da tabela
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'discount_coupon_purchases' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('\n📊 COLUNAS DA TABELA:');
      console.table(columns);
      
      // Verificar se user_id existe especificamente
      const userIdColumn = columns.find(col => col.column_name === 'user_id');
      console.log('\n🔍 Coluna user_id encontrada:', !!userIdColumn);
      
      if (userIdColumn) {
        console.log('✅ Detalhes da coluna user_id:', userIdColumn);
      } else {
        console.log('❌ Coluna user_id NÃO encontrada!');
        console.log('\n🔧 Será necessário adicionar a coluna user_id');
      }
      
      // Verificar registros existentes
      const recordCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM discount_coupon_purchases;
      `;
      
      console.log('\n📈 Total de registros:', recordCount[0].count);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();