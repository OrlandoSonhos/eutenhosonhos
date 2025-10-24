const { PrismaClient } = require('@prisma/client')

async function addDateColumns() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Adicionando colunas de data à tabela discount_coupons...')
    
    // Executar SQL raw para adicionar as colunas
    await prisma.$executeRaw`
      ALTER TABLE discount_coupons 
      ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP,
      ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP,
      ADD COLUMN IF NOT EXISTS max_uses INTEGER;
    `
    
    console.log('Colunas adicionadas com sucesso!')
    
    // Verificar se as colunas foram adicionadas
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupons' 
      AND column_name IN ('valid_from', 'valid_until', 'max_uses');
    `
    
    console.log('Colunas verificadas:', result)
    
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDateColumns()