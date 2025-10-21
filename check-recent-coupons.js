const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRecentCoupons() {
  try {
    console.log('🕐 VERIFICANDO CUPONS CRIADOS NA ÚLTIMA HORA...\n')

    // Última hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Buscar cupons criados na última hora
    const coupons = await prisma.coupon.findMany({
      where: {
        created_at: {
          gte: oneHourAgo
        }
      },
      include: {
        buyer: true,
        payment: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    console.log(`📋 CUPONS CRIADOS NA ÚLTIMA HORA (${coupons.length}):`)
    console.log()

    coupons.forEach((coupon, index) => {
      const createdTime = coupon.created_at.toLocaleTimeString('pt-BR')
      const createdDate = coupon.created_at.toLocaleDateString('pt-BR')
      
      console.log(`${index + 1}. 🎫 CUPOM: ${coupon.code}`)
      console.log(`   ⏰ Criado: ${createdDate} às ${createdTime}`)
      console.log(`   💰 Valor: R$ ${(coupon.face_value / 100).toFixed(2)}`)
      console.log(`   📊 Status: ${coupon.status}`)
      
      if (coupon.buyer) {
        console.log(`   👤 Comprador: ${coupon.buyer.name} (${coupon.buyer.email})`)
      } else {
        console.log(`   ❌ SEM COMPRADOR ASSOCIADO!`)
      }
      
      if (coupon.payment) {
        console.log(`   💳 Pagamento MP: ${coupon.payment.mp_payment_id}`)
        console.log(`   💵 Valor Pago: R$ ${(coupon.payment.amount_cents / 100).toFixed(2)}`)
        console.log(`   🔄 Status Pagamento: ${coupon.payment.status}`)
        if (coupon.payment.payer_email) {
          console.log(`   📧 Email Pagador: ${coupon.payment.payer_email}`)
        }
      } else {
        console.log(`   ❌ SEM PAGAMENTO ASSOCIADO!`)
      }
      console.log()
    })

    if (coupons.length === 0) {
      console.log('❌ Nenhum cupom criado na última hora')
    }

    // Verificar também os pagamentos mais recentes
    console.log('💳 VERIFICANDO PAGAMENTOS RECENTES...\n')
    
    const payments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: oneHourAgo
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    payments.forEach((payment, index) => {
      const createdTime = payment.created_at.toLocaleTimeString('pt-BR')
      console.log(`${index + 1}. 💳 Pagamento MP: ${payment.mp_payment_id}`)
      console.log(`   ⏰ Criado: ${createdTime}`)
      console.log(`   💵 Valor: R$ ${(payment.amount_cents / 100).toFixed(2)}`)
      console.log(`   🔄 Status: ${payment.status}`)
      if (payment.payer_email) {
        console.log(`   📧 Email: ${payment.payer_email}`)
      }
      console.log()
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentCoupons()