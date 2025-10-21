const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function simpleCheck() {
  let retries = 3
  
  while (retries > 0) {
    try {
      console.log(`🔍 Tentativa ${4 - retries}/3 - Verificando cupons para vini_deiro@icloud.com...`)
      
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: 'vini_deiro@icloud.com' }
      })
      
      if (!user) {
        console.log('❌ Usuário não encontrado')
        return
      }
      
      console.log(`✅ Usuário encontrado: ${user.name}`)
      
      // Buscar cupons
      const coupons = await prisma.coupon.findMany({
        where: { buyer_id: user.id },
        orderBy: { created_at: 'desc' },
        take: 10
      })
      
      console.log(`📊 Cupons encontrados: ${coupons.length}`)
      
      if (coupons.length > 0) {
        console.log('\n🎫 CUPONS:')
        coupons.forEach((coupon, index) => {
          console.log(`${index + 1}. ${coupon.code} - R$ ${(coupon.face_value_cents / 100).toFixed(2)} - ${coupon.status}`)
          console.log(`   Criado: ${coupon.created_at.toLocaleString('pt-BR')}`)
        })
      } else {
        console.log('❌ Nenhum cupom encontrado para este usuário')
        
        // Verificar cupons órfãos recentes
        console.log('\n🔍 Verificando cupons órfãos das últimas 24h...')
        const orphans = await prisma.coupon.findMany({
          where: {
            buyer_id: null,
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { created_at: 'desc' },
          take: 5
        })
        
        console.log(`📊 Cupons órfãos encontrados: ${orphans.length}`)
        orphans.forEach((coupon, index) => {
          console.log(`${index + 1}. ${coupon.code} - R$ ${(coupon.face_value_cents / 100).toFixed(2)} - ${coupon.status}`)
          console.log(`   Criado: ${coupon.created_at.toLocaleString('pt-BR')}`)
        })
      }
      
      break // Sucesso, sair do loop
      
    } catch (error) {
      retries--
      console.log(`❌ Erro (${retries} tentativas restantes):`, error.message)
      
      if (retries > 0) {
        console.log('⏳ Aguardando 2 segundos antes da próxima tentativa...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }
  
  if (retries === 0) {
    console.log('❌ Falha após 3 tentativas. Problema de conectividade com o banco.')
  }
}

simpleCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect())