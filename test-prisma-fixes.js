const { PrismaClient } = require('@prisma/client')

async function testPrismaFixes() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Testando correções do Prisma...')
    
    // 1. Testar consulta de DiscountCoupon
    console.log('\n1️⃣ Testando consulta de DiscountCoupon...')
    try {
      const discountCoupons = await prisma.discountCoupon.findMany({
        take: 3,
        select: {
          id: true,
          code: true,
          type: true,
          discount_percent: true,
          created_at: true
        }
      })
      console.log('✅ DiscountCoupon funcionando!')
      console.log(`   Encontrados: ${discountCoupons.length} cupons`)
      if (discountCoupons.length > 0) {
        console.log('   Exemplo:', discountCoupons[0])
      }
    } catch (error) {
      console.log('❌ Erro em DiscountCoupon:', error.message)
    }
    
    // 2. Testar consulta de DiscountCouponPurchase
    console.log('\n2️⃣ Testando consulta de DiscountCouponPurchase...')
    try {
      const purchases = await prisma.discountCouponPurchase.findMany({
        take: 3,
        select: {
          id: true,
          buyer_id: true,
          code: true,
          is_used: true,
          created_at: true
        }
      })
      console.log('✅ DiscountCouponPurchase funcionando!')
      console.log(`   Encontrados: ${purchases.length} compras`)
      if (purchases.length > 0) {
        console.log('   Exemplo:', purchases[0])
      }
    } catch (error) {
      console.log('❌ Erro em DiscountCouponPurchase:', error.message)
    }
    
    // 3. Testar consulta com relação
    console.log('\n3️⃣ Testando consulta com relação...')
    try {
      const purchasesWithRelation = await prisma.discountCouponPurchase.findMany({
        take: 2,
        include: {
          buyer: {
            select: {
              id: true,
              email: true
            }
          },
          discount_coupon: {
            select: {
              id: true,
              code: true,
              type: true,
              discount_percent: true
            }
          }
        }
      })
      console.log('✅ Relações funcionando!')
      console.log(`   Encontrados: ${purchasesWithRelation.length} compras com relações`)
      if (purchasesWithRelation.length > 0) {
        console.log('   Exemplo:', JSON.stringify(purchasesWithRelation[0], null, 2))
      }
    } catch (error) {
      console.log('❌ Erro nas relações:', error.message)
    }
    
    // 4. Testar busca específica que estava falhando
    console.log('\n4️⃣ Testando busca específica que estava falhando...')
    try {
      const specificCoupon = await prisma.discountCoupon.findFirst({
        where: {
          type: 'PERMANENT_25'
        }
      })
      console.log('✅ Busca por tipo funcionando!')
      if (specificCoupon) {
        console.log('   Cupom encontrado:', {
          id: specificCoupon.id,
          code: specificCoupon.code,
          type: specificCoupon.type,
          discount_percent: specificCoupon.discount_percent
        })
      } else {
        console.log('   Nenhum cupom PERMANENT_25 encontrado')
      }
    } catch (error) {
      console.log('❌ Erro na busca específica:', error.message)
    }
    
    console.log('\n✅ Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaFixes()
  .catch(console.error)