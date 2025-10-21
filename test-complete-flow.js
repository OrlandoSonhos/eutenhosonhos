const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testCompleteFlow() {
  try {
    console.log('🧪 TESTANDO FLUXO COMPLETO DE CUPONS...\n')

    // 1. Verificar se o cupom HYLIYAS9 está associado
    const existingCoupon = await prisma.coupon.findFirst({
      where: { code: 'HYLIYAS9' },
      include: { buyer: true }
    })

    console.log('1️⃣ Cupom existente:')
    console.log(`   Código: ${existingCoupon?.code}`)
    console.log(`   Comprador: ${existingCoupon?.buyer?.name || 'NÃO ASSOCIADO'}`)
    console.log(`   Email: ${existingCoupon?.buyer?.email || 'N/A'}`)
    console.log(`   Valor: R$ ${(existingCoupon?.face_value || 0) / 100}`)

    // 2. Verificar se aparece na lista de cupons do usuário
    if (existingCoupon?.buyer_id) {
      const userCoupons = await prisma.coupon.findMany({
        where: { buyer_id: existingCoupon.buyer_id },
        orderBy: { created_at: 'desc' }
      })

      console.log(`\n2️⃣ Cupons do usuário (${userCoupons.length} total):`)
      userCoupons.forEach((coupon, index) => {
        console.log(`   ${index + 1}. ${coupon.code} - R$ ${coupon.face_value / 100} - ${coupon.status}`)
      })
    }

    // 3. Verificar configurações de email
    console.log('\n3️⃣ Configurações de email:')
    console.log(`   SMTP configurado: ${process.env.SMTP_USER ? 'SIM' : 'NÃO'}`)
    console.log(`   SendGrid configurado: ${process.env.SENDGRID_API_KEY ? 'SIM' : 'NÃO'}`)

    console.log('\n✅ RESUMO:')
    console.log(`   ✓ Cupom criado no banco: ${existingCoupon ? 'SIM' : 'NÃO'}`)
    console.log(`   ✓ Cupom associado ao usuário: ${existingCoupon?.buyer ? 'SIM' : 'NÃO'}`)
    console.log(`   ✓ Email configurado: ${process.env.SMTP_USER ? 'SIM' : 'NÃO'}`)
    console.log(`   ✓ Cupom aparece em "Meus Cartões": ${existingCoupon?.buyer ? 'SIM' : 'NÃO'}`)

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleteFlow()