const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function fixAllOrphanCoupons() {
  try {
    console.log('🔍 PROCURANDO TODOS OS CUPONS ÓRFÃOS...\n')

    // Buscar todos os cupons sem buyer_id
    const orphanCoupons = await prisma.coupon.findMany({
      where: { buyer_id: null },
      orderBy: { created_at: 'desc' },
      include: {
        payment: true
      }
    })

    console.log(`📊 Encontrados ${orphanCoupons.length} cupons órfãos:\n`)

    for (const coupon of orphanCoupons) {
      console.log(`🎫 Cupom: ${coupon.code}`)
      console.log(`   Valor: R$ ${coupon.face_value / 100}`)
      console.log(`   Criado: ${coupon.created_at}`)
      
      if (coupon.payment) {
        console.log(`   Pagamento ID: ${coupon.payment.mp_payment_id}`)
      }

      // Tentar encontrar usuário por diferentes métodos
      let user = null
      let method = ''

      // 1. Buscar por email específicos conhecidos
      if (coupon.payment?.mp_payment_id) {
        // Para o vini_deiro@icloud.com
        const viniUser = await prisma.user.findUnique({
          where: { email: 'vini_deiro@icloud.com' }
        })
        
        if (viniUser) {
          user = viniUser
          method = 'email vini_deiro@icloud.com'
        }
      }

      // 2. Se não encontrou, buscar por sessão mais recente
      if (!user) {
        const recentSession = await prisma.session.findFirst({
          orderBy: { expires: 'desc' },
          include: { user: true }
        })

        if (recentSession) {
          user = recentSession.user
          method = 'sessão mais recente'
        }
      }

      // 3. Se ainda não encontrou, buscar usuário Orlando (fallback)
      if (!user) {
        user = await prisma.user.findUnique({
          where: { email: 'contatoeutenhosonhos@gmail.com' }
        })
        method = 'fallback Orlando'
      }

      if (user) {
        console.log(`   👤 Associando a: ${user.name} (${user.email}) via ${method}`)
        
        // Atualizar cupom
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { buyer_id: user.id }
        })

        // Tentar enviar email
        try {
          const { sendCouponEmail } = await import('./src/lib/email.ts')
          
          await sendCouponEmail({
            to: user.email,
            couponCode: coupon.code,
            couponValue: coupon.face_value,
            customerName: user.name
          })
          
          console.log(`   ✅ Email enviado para ${user.email}`)
        } catch (emailError) {
          console.log(`   ⚠️ Erro ao enviar email: ${emailError.message}`)
        }
      } else {
        console.log(`   ❌ Não foi possível encontrar usuário para associar`)
      }
      
      console.log()
    }

    // Verificar resultado final
    const remainingOrphans = await prisma.coupon.count({
      where: { buyer_id: null }
    })

    console.log(`\n📈 RESULTADO:`)
    console.log(`   Cupons órfãos restantes: ${remainingOrphans}`)
    console.log(`   Cupons corrigidos: ${orphanCoupons.length - remainingOrphans}`)

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllOrphanCoupons()