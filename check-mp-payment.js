const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMPPayment() {
  try {
    console.log('🔍 VERIFICANDO DADOS DO PAGAMENTO MP...\n')

    // Buscar o último pagamento
    const lastPayment = await prisma.payment.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        coupon: true
      }
    })

    if (!lastPayment) {
      console.log('❌ Nenhum pagamento encontrado')
      return
    }

    console.log('💳 ÚLTIMO PAGAMENTO:')
    console.log('   MP Payment ID:', lastPayment.mp_payment_id)
    console.log('   Valor:', `R$ ${(lastPayment.amount_cents / 100).toFixed(2)}`)
    console.log('   Status:', lastPayment.status)
    console.log('   Método:', lastPayment.method)
    console.log('   Cupom ID:', lastPayment.coupon_id)
    console.log('   Cupom Código:', lastPayment.coupon?.code)

    // Simular busca de usuário por diferentes emails
    console.log('\n👥 TESTANDO BUSCA DE USUÁRIOS:')
    
    const testEmails = [
      'contatoeutenhosonhos@gmail.com',
      'matiasarezo26@gmail.com',
      'jp791482@gmail.com'
    ]

    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      })
      console.log(`   ${email}: ${user ? `ENCONTRADO (${user.name})` : 'NÃO ENCONTRADO'}`)
    }

    // Verificar se há algum usuário logado recentemente
    console.log('\n🔐 USUÁRIOS RECENTES:')
    const recentSessions = await prisma.session.findMany({
      orderBy: { expires: 'desc' },
      take: 3,
      include: {
        user: true
      }
    })

    recentSessions.forEach(session => {
      console.log(`   ${session.user.email} - Expira: ${session.expires}`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMPPayment()