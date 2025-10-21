const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRecentPurchase() {
  try {
    console.log('🔍 VERIFICANDO COMPRAS DOS ÚLTIMOS 10 MINUTOS...\n')
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    
    // Buscar cupons criados nos últimos 10 minutos
    const recentCoupons = await prisma.coupon.findMany({
      where: {
        created_at: {
          gte: tenMinutesAgo
        }
      },
      include: {
        buyer: {
          select: {
            name: true,
            email: true
          }
        },
        payment: true
      },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`📊 Cupons criados nos últimos 10 minutos: ${recentCoupons.length}\n`)
    
    if (recentCoupons.length === 0) {
      console.log('❌ Nenhum cupom criado nos últimos 10 minutos')
      console.log('⚠️  Isso pode indicar que o webhook não está sendo chamado ou há problema no processamento')
    } else {
      recentCoupons.forEach((coupon, index) => {
        console.log(`${index + 1}. 🎫 CUPOM: ${coupon.code}`)
        console.log(`   💰 Valor: R$ ${(coupon.face_value_cents / 100).toFixed(2)}`)
        console.log(`   📊 Status: ${coupon.status}`)
        console.log(`   📅 Criado: ${coupon.created_at.toLocaleString('pt-BR')}`)
        
        if (coupon.buyer) {
          console.log(`   👤 Comprador: ${coupon.buyer.name} (${coupon.buyer.email})`)
        } else {
          console.log(`   👤 Comprador: Não associado (cupom órfão)`)
        }
        
        if (coupon.payment) {
          console.log(`   💳 Pagamento: ${coupon.payment.mp_payment_id} - ${coupon.payment.status}`)
          console.log(`   💵 Valor pago: R$ ${(coupon.payment.amount_cents / 100).toFixed(2)}`)
        }
        
        console.log('')
      })
    }
    
    // Verificar também pagamentos recentes
    console.log('💳 VERIFICANDO PAGAMENTOS DOS ÚLTIMOS 10 MINUTOS...\n')
    
    const recentPayments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: tenMinutesAgo
        }
      },
      include: {
        coupon: {
          include: {
            buyer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`📊 Pagamentos dos últimos 10 minutos: ${recentPayments.length}\n`)
    
    if (recentPayments.length === 0) {
      console.log('❌ Nenhum pagamento registrado nos últimos 10 minutos')
    } else {
      recentPayments.forEach((payment, index) => {
        console.log(`${index + 1}. 💳 PAGAMENTO: ${payment.mp_payment_id}`)
        console.log(`   💰 Valor: R$ ${(payment.amount_cents / 100).toFixed(2)}`)
        console.log(`   📊 Status: ${payment.status}`)
        console.log(`   📅 Criado: ${payment.created_at.toLocaleString('pt-BR')}`)
        
        if (payment.coupon?.buyer) {
          console.log(`   👤 Comprador: ${payment.coupon.buyer.name} (${payment.coupon.buyer.email})`)
          console.log(`   🎫 Cupom: ${payment.coupon.code}`)
        }
        
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentPurchase()