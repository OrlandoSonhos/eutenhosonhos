const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugLastPayment() {
  try {
    console.log('🔍 INVESTIGANDO ÚLTIMO PAGAMENTO...\n')

    // Buscar o último cupom criado
    const lastCoupon = await prisma.coupon.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        buyer: true
      }
    })

    if (!lastCoupon) {
      console.log('❌ Nenhum cupom encontrado')
      return
    }

    console.log('📋 ÚLTIMO CUPOM:')
    console.log('   ID:', lastCoupon.id)
    console.log('   Código:', lastCoupon.code)
    console.log('   Valor:', `R$ ${(lastCoupon.face_value_cents / 100).toFixed(2)}`)
    console.log('   Status:', lastCoupon.status)
    console.log('   Buyer ID:', lastCoupon.buyer_id)
    console.log('   Criado em:', lastCoupon.created_at)
    console.log('   Comprador:', lastCoupon.buyer ? `${lastCoupon.buyer.name} (${lastCoupon.buyer.email})` : 'NULL')

    // Buscar pagamento relacionado
    const payment = await prisma.payment.findFirst({
      where: { coupon_id: lastCoupon.id }
    })

    console.log('\n💳 PAGAMENTO RELACIONADO:')
    if (payment) {
      console.log('   ID:', payment.id)
      console.log('   MP Payment ID:', payment.mp_payment_id)
      console.log('   Valor:', `R$ ${(payment.amount_cents / 100).toFixed(2)}`)
      console.log('   Status:', payment.status)
      console.log('   Método:', payment.method)
    } else {
      console.log('   ❌ Nenhum pagamento encontrado para este cupom')
    }

    // Buscar usuários com email similar ao do pagamento
    if (payment) {
      console.log('\n👥 VERIFICANDO USUÁRIOS...')
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 5
      })

      console.log('   Últimos 5 usuários:')
      users.forEach(user => {
        console.log(`     ${user.id}: ${user.name} (${user.email}) - ${user.created_at}`)
      })
    }

    // Verificar configurações de email
    console.log('\n📧 CONFIGURAÇÕES DE EMAIL:')
    console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA')
    console.log('   SMTP_USER:', process.env.SMTP_USER || 'NÃO CONFIGURADO')
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURADA' : 'NÃO CONFIGURADA')
    console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com')
    console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugLastPayment()