const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserCoupons() {
  try {
    console.log('👥 VERIFICANDO CUPONS POR USUÁRIO...\n')

    // Buscar todos os usuários com cupons
    const users = await prisma.user.findMany({
      include: {
        coupons: {
          orderBy: { created_at: 'desc' }
        }
      }
    })

    users.forEach(user => {
      if (user.coupons.length > 0) {
        console.log(`👤 ${user.name} (${user.email}):`)
        user.coupons.forEach((coupon, index) => {
          console.log(`   ${index + 1}. ${coupon.code} - R$ ${coupon.face_value / 100} - ${coupon.status}`)
        })
        console.log()
      }
    })

    // Verificar se ainda há cupons órfãos
    const orphanCount = await prisma.coupon.count({
      where: { buyer_id: null }
    })

    console.log(`📊 RESUMO:`)
    console.log(`   Usuários com cupons: ${users.filter(u => u.coupons.length > 0).length}`)
    console.log(`   Total de cupons: ${users.reduce((acc, u) => acc + u.coupons.length, 0)}`)
    console.log(`   Cupons órfãos: ${orphanCount}`)

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserCoupons()