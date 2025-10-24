const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela discount_coupon_purchases...')
    
    // Verificar se a tabela existe e suas colunas
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupon_purchases'
      ORDER BY ordinal_position;
    `
    
    console.log('📋 Estrutura da tabela discount_coupon_purchases:')
    result.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`)
    })
    
    // Verificar se há dados na tabela
    const count = await prisma.$queryRaw`SELECT COUNT(*) as total FROM discount_coupon_purchases`
    console.log(`\n📊 Total de registros: ${count[0].total}`)
    
    // Se há registros, mostrar alguns exemplos
    if (count[0].total > 0) {
      const samples = await prisma.$queryRaw`SELECT * FROM discount_coupon_purchases LIMIT 3`
      console.log('\n📝 Exemplos de registros:')
      samples.forEach((record, index) => {
        console.log(`  ${index + 1}:`, record)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTableStructure()