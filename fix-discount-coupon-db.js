const { PrismaClient } = require('@prisma/client')

async function fixDiscountCouponDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Iniciando correções no banco de dados...')
    
    // 1. Verificar tipos existentes na tabela DiscountCoupon
    console.log('\n📊 Verificando tipos existentes...')
    const existingTypes = await prisma.$queryRaw`
      SELECT DISTINCT type FROM "DiscountCoupon"
    `
    console.log('Tipos encontrados:', existingTypes)
    
    // 2. Verificar se a tabela discount_coupon_purchases existe e tem a coluna user_id
    console.log('\n🔍 Verificando estrutura da tabela discount_coupon_purchases...')
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'discount_coupon_purchases'
        ORDER BY column_name
      `
      console.log('Colunas da tabela discount_coupon_purchases:', tableInfo)
    } catch (error) {
      console.log('Erro ao verificar tabela:', error.message)
    }
    
    // 3. Verificar se existem registros em DiscountCouponPurchase
    console.log('\n📋 Verificando registros em DiscountCouponPurchase...')
    try {
      const purchaseCount = await prisma.discountCouponPurchase.count()
      console.log(`Total de registros em DiscountCouponPurchase: ${purchaseCount}`)
      
      if (purchaseCount > 0) {
        const samplePurchases = await prisma.discountCouponPurchase.findMany({
          take: 3,
          select: {
            id: true,
            user_id: true,
            discount_coupon_id: true,
            code: true,
            created_at: true
          }
        })
        console.log('Exemplos de registros:', samplePurchases)
      }
    } catch (error) {
      console.log('Erro ao verificar DiscountCouponPurchase:', error.message)
    }
    
    // 4. Aplicar correções via SQL direto
    console.log('\n🛠️ Aplicando correções...')
    
    // Criar enum se não existir
    try {
      await prisma.$executeRaw`
        DO $$ BEGIN
            CREATE TYPE "DiscountCouponType" AS ENUM ('PERMANENT_25', 'SPECIAL_50');
        EXCEPTION
            WHEN duplicate_object THEN 
                RAISE NOTICE 'Enum DiscountCouponType já existe';
        END $$;
      `
      console.log('✅ Enum DiscountCouponType criado/verificado')
    } catch (error) {
      console.log('❌ Erro ao criar enum:', error.message)
    }
    
    // Verificar se podemos alterar o tipo da coluna
    try {
      const invalidTypes = await prisma.$queryRaw`
        SELECT type, COUNT(*) as count 
        FROM "DiscountCoupon" 
        WHERE type NOT IN ('PERMANENT_25', 'SPECIAL_50')
        GROUP BY type
      `
      
      if (invalidTypes.length === 0) {
        console.log('✅ Todos os tipos são válidos, alterando coluna...')
        await prisma.$executeRaw`
          ALTER TABLE "DiscountCoupon" 
          ALTER COLUMN type TYPE "DiscountCouponType" 
          USING type::"DiscountCouponType"
        `
        console.log('✅ Coluna type alterada para enum')
      } else {
        console.log('❌ Tipos inválidos encontrados:', invalidTypes)
        console.log('Será necessário corrigir os dados antes de alterar o tipo')
      }
    } catch (error) {
      console.log('❌ Erro ao alterar tipo da coluna:', error.message)
    }
    
    console.log('\n✅ Processo de correção concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDiscountCouponDatabase()
  .catch(console.error)