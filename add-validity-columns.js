const { PrismaClient } = require('@prisma/client')

async function addValidityColumns() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Adicionando colunas valid_from e valid_until à tabela discount_coupons...')
    
    // Adicionar as colunas diretamente via SQL
    await prisma.$executeRaw`
      ALTER TABLE discount_coupons 
      ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP,
      ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
    `
    
    console.log('✅ Colunas adicionadas com sucesso!')
    
    // Verificar se as colunas foram criadas
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupons' 
      AND column_name IN ('valid_from', 'valid_until')
      ORDER BY column_name;
    `
    
    console.log('📋 Colunas criadas:', result)
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addValidityColumns()