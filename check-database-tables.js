const { PrismaClient } = require('@prisma/client')

async function checkDatabaseTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando tabelas no banco de dados...')
    
    // Listar todas as tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log('\n📋 Tabelas encontradas:')
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`)
    })
    
    // Verificar especificamente tabelas relacionadas a cupons
    console.log('\n🎫 Tabelas relacionadas a cupons:')
    const couponTables = tables.filter(table => 
      table.table_name.toLowerCase().includes('coupon') || 
      table.table_name.toLowerCase().includes('discount')
    )
    
    for (const table of couponTables) {
      console.log(`\n📊 Estrutura da tabela: ${table.table_name}`)
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = ${table.table_name}
        ORDER BY ordinal_position
      `
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseTables()
  .catch(console.error)