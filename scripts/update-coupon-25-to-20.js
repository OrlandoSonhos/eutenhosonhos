require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateCouponFrom25To20() {
  try {
    console.log('🔄 Atualizando cupom geral de 25% para 20%...')
    
    // 1. Primeiro, vamos verificar os cupons PERMANENT_25 existentes
    const permanent25Coupons = await prisma.discountCoupon.findMany({
      where: { type: 'PERMANENT_25' }
    })
    
    console.log(`📊 Encontrados ${permanent25Coupons.length} cupons PERMANENT_25`)
    
    if (permanent25Coupons.length > 0) {
      // 2. Atualizar a porcentagem de desconto de 25% para 20%
      const updateResult = await prisma.discountCoupon.updateMany({
        where: { type: 'PERMANENT_25' },
        data: { discount_percent: 20 }
      })
      
      console.log(`✅ ${updateResult.count} cupons atualizados de 25% para 20%`)
      
      // 3. Verificar os cupons atualizados
      const updatedCoupons = await prisma.discountCoupon.findMany({
        where: { type: 'PERMANENT_25' },
        select: {
          id: true,
          type: true,
          discount_percent: true,
          sale_price_cents: true,
          is_active: true
        }
      })
      
      console.log('\n📋 Cupons PERMANENT_25 após atualização:')
      updatedCoupons.forEach((coupon, index) => {
        console.log(`${index + 1}. ID: ${coupon.id}`)
        console.log(`   Tipo: ${coupon.type}`)
        console.log(`   Desconto: ${coupon.discount_percent}%`)
        console.log(`   Preço de venda: R$ ${(coupon.sale_price_cents || 0) / 100}`)
        console.log(`   Ativo: ${coupon.is_active ? 'Sim' : 'Não'}`)
        console.log('')
      })
    } else {
      console.log('⚠️ Nenhum cupom PERMANENT_25 encontrado para atualizar')
    }
    
    console.log('🎉 Processo de atualização concluído!')
    console.log('📝 Nota: O enum PERMANENT_25 continua com o mesmo nome, mas agora representa 20% de desconto')
    console.log('📝 Será necessário atualizar as referências no código para refletir a mudança de 25% para 20%')
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cupons:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCouponFrom25To20()