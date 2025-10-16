const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function addShippingColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗄️ Conectando ao banco de produção...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'add-shipping-columns.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir em comandos separados
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    console.log('📋 Executando comandos SQL...');
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`Executando: ${command.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(command);
      }
    }
    
    console.log('✅ Colunas de shipping adicionadas com sucesso!');
    
    // Verificar se as colunas foram criadas
    console.log('🔍 Verificando colunas criadas...');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name LIKE 'shipping_%'
      ORDER BY column_name
    `);
    
    console.log('Colunas de shipping encontradas:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addShippingColumns();