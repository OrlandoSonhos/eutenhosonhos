const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSalePriceColumn() {
  try {
    console.log('🔄 Adicionando coluna sale_price_cents à tabela discount_coupons...')
    
    // Adicionar a coluna sale_price_cents
    await prisma.$executeRaw`
      ALTER TABLE discount_coupons 
      ADD COLUMN IF NOT EXISTS sale_price_cents INTEGER;
    `
    
    console.log('✅ Coluna sale_price_cents adicionada com sucesso!')
    
    // Verificar a estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela discount_coupons:')
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'discount_coupons' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
    
    console.table(tableInfo)
    
    // Verificar cupons existentes
    console.log('\n📊 Cupons existentes:')
    const existingCoupons = await prisma.discountCoupon.findMany({
      select: {
        id: true,
        code: true,
        discount_percent: true,
        type: true,
        sale_price_cents: true,
        is_active: true
      }
    })
    
    console.table(existingCoupons)
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSalePriceColumn()