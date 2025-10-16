const { PrismaClient } = require('@prisma/client');

async function addColumnsDirectly() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗄️ Conectando ao banco de produção...');
    console.log('URL do banco:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    // Verificar conexão
    await prisma.$connect();
    console.log('✅ Conectado ao banco!');
    
    // Verificar se a tabela orders existe
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'orders'
    `);
    
    console.log('Tabelas encontradas:', tables);
    
    if (tables.length === 0) {
      console.log('❌ Tabela orders não encontrada!');
      process.exit(1);
    }
    
    // Verificar colunas existentes
    const existingColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public'
      ORDER BY column_name
    `);
    
    console.log('Colunas existentes na tabela orders:');
    existingColumns.forEach(col => console.log(`- ${col.column_name}`));
    
    // Adicionar colunas uma por uma
    const columnsToAdd = [
      'shipping_cents INTEGER',
      'shipping_cep VARCHAR(255)',
      'shipping_address VARCHAR(255)',
      'shipping_number VARCHAR(255)',
      'shipping_complement VARCHAR(255)',
      'shipping_district VARCHAR(255)',
      'shipping_city VARCHAR(255)',
      'shipping_state VARCHAR(255)'
    ];
    
    for (const column of columnsToAdd) {
      const columnName = column.split(' ')[0];
      
      // Verificar se a coluna já existe
      const columnExists = existingColumns.some(col => col.column_name === columnName);
      
      if (!columnExists) {
        console.log(`Adicionando coluna: ${columnName}`);
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN ${column}`);
          console.log(`✅ Coluna ${columnName} adicionada!`);
        } catch (error) {
          console.log(`⚠️ Erro ao adicionar ${columnName}:`, error.message);
        }
      } else {
        console.log(`ℹ️ Coluna ${columnName} já existe`);
      }
    }
    
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addColumnsDirectly();