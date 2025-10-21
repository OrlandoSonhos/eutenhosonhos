const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTodayCoupons() {
  try {
    console.log('🎫 VERIFICANDO CUPONS CRIADOS HOJE...\n')

    // Data de hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Buscar cupons criados hoje
    const coupons = await prisma.coupon.findMany({
      where: {
        created_at: {
          gte: today
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

    console.log(`📋 CUPONS CRIADOS HOJE (${coupons.length}):`)
    console.log()

    coupons.forEach((coupon, index) => {
      console.log(`${index + 1}. 🎫 CUPOM: ${coupon.code}`)
      console.log(`   ID: ${coupon.id}`)
      console.log(`   Valor: R$ ${(coupon.face_value / 100).toFixed(2)}`)
      console.log(`   Status: ${coupon.status}`)
      console.log(`   Tipo: ${coupon.type}`)
      console.log(`   Criado: ${coupon.created_at.toLocaleString('pt-BR')}`)
      
      if (coupon.buyer) {
        console.log(`   👤 Comprador: ${coupon.buyer.name} (${coupon.buyer.email})`)
      } else {
        console.log(`   ❌ Sem comprador associado`)
      }
      
      if (coupon.payment) {
        console.log(`   💳 Pagamento MP: ${coupon.payment.mp_payment_id}`)
        console.log(`   💰 Valor Pago: R$ ${(coupon.payment.amount_cents / 100).toFixed(2)}`)
        console.log(`   📧 Email Pagador: ${coupon.payment.payer_email}`)
        console.log(`   🔄 Status Pagamento: ${coupon.payment.status}`)
      } else {
        console.log(`   ❌ Sem pagamento associado`)
      }
      console.log()
    })

    // Verificar se há cupons órfãos criados hoje
    const orphanCoupons = coupons.filter(c => !c.buyer)
    if (orphanCoupons.length > 0) {
      console.log(`⚠️  ATENÇÃO: ${orphanCoupons.length} cupons órfãos criados hoje!`)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTodayCoupons()