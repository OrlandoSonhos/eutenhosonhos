const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRecentPayments() {
  try {
    console.log('🔍 VERIFICANDO PAGAMENTOS RECENTES...')
    
    // Buscar pagamentos das últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    
    const payments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: twoHoursAgo
        }
      },
      include: {
        coupon: {
          include: {
            buyer: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })
    
    console.log(`\n📊 ENCONTRADOS ${payments.length} PAGAMENTOS NAS ÚLTIMAS 2 HORAS:\n`)
    
    if (payments.length === 0) {
      console.log('❌ Nenhum pagamento encontrado nas últimas 2 horas')
      return
    }
    
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. PAGAMENTO:`)
      console.log(`   💳 MP Payment ID: ${payment.mp_payment_id}`)
      console.log(`   💰 Valor: R$ ${(payment.amount_cents / 100).toFixed(2)}`)
      console.log(`   📅 Data: ${payment.created_at.toLocaleString('pt-BR')}`)
      console.log(`   ✅ Status: ${payment.status}`)
      console.log(`   💳 Método: ${payment.method}`)
      
      if (payment.coupon) {
        console.log(`   🎫 Cupom: ${payment.coupon.code}`)
        console.log(`   💵 Valor do Cupom: R$ ${(payment.coupon.face_value_cents / 100).toFixed(2)}`)
        console.log(`   📊 Status do Cupom: ${payment.coupon.status}`)
        
        if (payment.coupon.buyer) {
          console.log(`   👤 Comprador: ${payment.coupon.buyer.name}`)
          console.log(`   📧 Email: ${payment.coupon.buyer.email}`)
        } else {
          console.log(`   👤 Comprador: Não identificado`)
        }
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentPayments()