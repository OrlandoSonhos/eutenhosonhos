const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Verificar se a tabela existe usando uma query SQL direta
    const result = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE '%discount%';
    `;
    
    console.log('Tabelas relacionadas a discount:', result);
    
    // Tentar contar registros na tabela
    try {
      const count = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM discount_coupons;
      `;
      console.log('Número de registros em discount_coupons:', count);
    } catch (error) {
      console.log('Erro ao contar registros:', error.message);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();