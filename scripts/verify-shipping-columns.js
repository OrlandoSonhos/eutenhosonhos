const { PrismaClient } = require('@prisma/client');

async function verifyShippingColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando colunas de shipping...');
    
    // Verificar se as colunas existem
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name LIKE 'shipping_%'
      ORDER BY column_name
    `);
    
    console.log('Colunas de shipping encontradas:');
    columns.forEach(col => {
      console.log(`✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    if (columns.length === 0) {
      console.log('❌ Nenhuma coluna de shipping encontrada!');
      process.exit(1);
    }
    
    // Testar se conseguimos fazer uma consulta com as novas colunas
    console.log('\n🧪 Testando consulta com colunas de shipping...');
    const testQuery = await prisma.order.findFirst({
      select: {
        id: true,
        shipping_cents: true,
        shipping_cep: true,
        shipping_address: true,
        shipping_city: true,
        shipping_state: true
      }
    });
    
    console.log('✅ Consulta com colunas de shipping funcionou!');
    console.log('Exemplo de pedido:', testQuery);
    
  } catch (error) {
    console.error('❌ Erro ao verificar colunas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyShippingColumns();