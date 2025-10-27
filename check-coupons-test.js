const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const coupons = await prisma.discountCoupon.findMany()
    console.log('Total tipos de cupons:', coupons.length)
    
    coupons.forEach((c, i) => {
      console.log(`${i+1}. Tipo: ${c.type} - Ativo: ${c.is_active} - ${c.discount_percent}%`)
    })
    
    // Verificar cupons comprados pelos usuários
    const purchases = await prisma.discountCouponPurchase.findMany({
      include: {
        discount_coupon: true,
        buyer: true
      },
      take: 5
    })
    
    console.log('\nCupons comprados (últimos 5):')
    purchases.forEach((p, i) => {
      console.log(`${i+1}. Código: ${p.code} - Usado: ${p.used_at ? 'Sim' : 'Não'} - Comprador: ${p.buyer.email}`)
    })
    
  } catch(e) {
    console.error('Erro:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()