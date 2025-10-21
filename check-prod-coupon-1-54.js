const { PrismaClient } = require('@prisma/client')

// Usar a URL de produção diretamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.rnqjqhqjqjqjqjqj:Eutenhosonhos2025#@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    }
  }
})

async function checkProdCoupon() {
  try {
    console.log('🔍 Verificando cupons criados entre 1:50 e 2:00...')
    
    // Buscar cupons criados entre 1:50 e 2:00
    const startTime = new Date('2025-10-21T01:50:00.000Z')
    const endTime = new Date('2025-10-21T02:00:00.000Z')
    
    const coupons = await prisma.coupon.findMany({
      where: {
        createdAt: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        payment: true,
        buyer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Encontrados ${coupons.length} cupons no período`)
    
    for (const coupon of coupons) {
      console.log('\n' + '='.repeat(50))
      console.log(`🎫 Cupom: ${coupon.code}`)
      console.log(`📅 Criado: ${coupon.createdAt.toISOString()}`)
      console.log(`💰 Valor: R$ ${coupon.value.toFixed(2)}`)
      console.log(`📊 Status: ${coupon.status}`)
      
      if (coupon.buyer) {
        console.log(`👤 Comprador: ${coupon.buyer.name} (${coupon.buyer.email})`)
      }
      
      if (coupon.payment) {
        console.log(`💳 Pagamento: ${coupon.payment.mercadoPagoId}`)
        console.log(`📊 Status Pagamento: ${coupon.payment.status}`)
        console.log(`💰 Valor Pago: R$ ${coupon.payment.amount.toFixed(2)}`)
        console.log(`📝 External Ref: ${coupon.payment.externalReference}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar cupons:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkProdCoupon()