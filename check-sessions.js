const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSessions() {
  try {
    console.log('🔍 VERIFICANDO SESSÕES...\n')

    // Buscar todas as sessões
    const sessions = await prisma.session.findMany({
      orderBy: { expires: 'desc' },
      include: {
        user: true
      }
    })

    console.log(`📊 Total de sessões: ${sessions.length}\n`)

    if (sessions.length === 0) {
      console.log('❌ Nenhuma sessão encontrada')
      
      // Vamos associar manualmente ao usuário mais provável
      console.log('\n🔧 ASSOCIANDO MANUALMENTE...')
      
      // Buscar o usuário Orlando Estrela (que parece ser o dono)
      const user = await prisma.user.findUnique({
        where: { email: 'contatoeutenhosonhos@gmail.com' }
      })

      if (user) {
        console.log('👤 Usuário encontrado:', user.name, user.email)
        
        // Buscar cupom órfão
        const orphanCoupon = await prisma.coupon.findFirst({
          where: { buyer_id: null },
          orderBy: { created_at: 'desc' }
        })

        if (orphanCoupon) {
          // Atualizar cupom
          const updatedCoupon = await prisma.coupon.update({
            where: { id: orphanCoupon.id },
            data: { buyer_id: user.id },
            include: { buyer: true }
          })

          console.log('✅ Cupom associado:', updatedCoupon.code, 'para', updatedCoupon.buyer?.name)
        }
      }
      
      return
    }

    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Sessão:`)
      console.log(`   Usuário: ${session.user.name} (${session.user.email})`)
      console.log(`   Expira: ${session.expires}`)
      console.log(`   Ativa: ${session.expires > new Date() ? 'SIM' : 'NÃO'}`)
      console.log()
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSessions()